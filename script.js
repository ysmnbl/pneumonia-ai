let currentDiagnosis = "";
//mobile menu
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle)
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

//title of banner
const typingText = document.getElementById("typing-text");
if (typingText) {
  const text = "AI Powered Pneumonia Detection System";
  let i = 0;
  const speed = 60;
  function typeWriter() {
    if (i < text.length) {
      typingText.textContent = text.slice(0, i + 1);
      i++;
      setTimeout(typeWriter, speed);
    }
  }
  typeWriter();
}
//about section
const counters = document.querySelectorAll(".counter");
const statsSection = document.querySelector(".stats-container");

if (counters.length > 0 && statsSection) {
  const startCounter = (counter) => {
    const target = +counter.getAttribute("data-target");
    let count = 0;
    const increment = target / 80;

    const updateCounter = () => {
      count += increment;
      if (count < target) {
        if (target === 90) {
          counter.textContent = Math.ceil(count) + "%";
        } else if (target === 24) {
          counter.textContent = Math.ceil(count) + "/7";
        } else if (target === 5000) {
          counter.textContent = Math.ceil(count) + "";
        } else {
          counter.textContent = Math.ceil(count);
        }
        requestAnimationFrame(updateCounter);
      } else {
        if (target === 90) {
          counter.textContent = "+90";
        } else if (target === 24) {
          counter.textContent = "24/7";
        } else if (target === 5000) {
          counter.textContent = "5000";
        } else {
          counter.innerText = target;
        }
      }
    };
    updateCounter();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach((counter) => {
            if (!counter.classList.contains("started")) {
              counter.classList.add("started");
              startCounter(counter);
            }
          });
        }
      });
    },
    { threshold: 0.3 },
  );
  observer.observe(statsSection);
}
//advantage section
/*bar cards*/
document.addEventListener("DOMContentLoaded", () => {
  const advantageSection = document.querySelector(".advantage-section");
  if (advantageSection) {
    window.addEventListener(
      "scroll",
      () => {
        const rect = advantageSection.getBoundingClientRect();
        if (rect.top < window.innerHeight - 150 && rect.bottom > 150) {
          advantageSection.classList.add("active");
        } else {
          advantageSection.classList.remove("active");
        }
      },
      { passive: true },
    );
  }
  const cards = document.querySelectorAll(".advantage-card");
  if (cards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const index = Array.from(cards).indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add("show");
            }, index * 200);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    cards.forEach((card) => observer.observe(card));
  }
});
//Detection section
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const loader = document.getElementById("loader");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");
const resultFill = document.getElementById("resultFill");
const barStatus = document.getElementById("barStatus");
const uploadStatus = document.getElementById("uploadStatus");
const assistantBtn = document.getElementById("assistantBtn");
const adviceBtnContainer = document.getElementById("adviceBtnContainer");
/*image preview*/
if (fileInput) {
  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      preview.classList.add("loaded");
    }
    if (resultText) resultText.textContent = "No Prediction Yet";
    if (resultFill) resultFill.style.width = "0%";
    if (barStatus) barStatus.textContent = "";

    if (resultBox) {
      resultBox.classList.remove("normal", "pneumonia");
    }
    if (adviceBtnContainer) {
      adviceBtnContainer.style.display = "none";
    }
    if (uploadStatus) {
      uploadStatus.innerText = "Image selected";
      uploadStatus.classList.add("success");
    }
  });
}
/*predict*/
async function predict(modelType) {
  if (!fileInput || !fileInput.files[0]) {
    alert("Plese upload an X-ray image first!");
    return;
  }
  let endpoint = "";
  let displayName = "";

  if (modelType === "CNN") {
    endpoint = "/predict";
    displayName = "CNN";
  } else if (modelType === "EfficientNet") {
    endpoint = "/predict2";
    displayName = "EfficientNetB0";
  }

  loader.style.display = "block";
  resultText.textContent = `Analyzing with ${displayName}...`;
  resultFill.style.width = "0%";
  barStatus.textContent = "";
  resultBox.classList.remove("normal", "pneumonia");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Server error");
    }
    loader.style.display = "none";

    const confidence = Math.round(data.confidence);
    resultText.textContent = `${data.prediction} (${confidence}%)`;
    resultFill.style.width = data.confidence + "%";

    if (confidence >= 90) {
      barStatus.textContent = "Complete";
    }
    currentDiagnosis = data.prediction;

    if (data.prediction === "PNEUMONIA") {
      resultBox.classList.add("pneumonia");
    } else {
      resultBox.classList.add("normal");
    }
    if (adviceBtnContainer) {
      adviceBtnContainer.style.display = "block";
    }
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    if (loader) loader.style.display = "none";
    if (resultText) resultText.textContent = "Server Error" + error.message;
    console.error("Prediction error: ", error);
  }
}
window.predict = predict;
/*assistant btn*/
if (assistantBtn) {
  assistantBtn.addEventListener("click", function (e) {
    if (currentDiagnosis === "") {
      e.preventDefault();
      alert(
        "Please perform a diagnosis first before accessing the AI Medical Assistant.",
      );
      return;
    }
    localStorage.setItem("diagnosisResult", currentDiagnosis);
    if (preview && preview.src) {
      localStorage.setItem("diagnosisImage", preview.src);
    }
    window.location.href = "result.html";
  });
}
//load diagnosis result
const savedResult = localStorage.getItem("diagnosisResult");
const savedImage = localStorage.getItem("diagnosisImage");

const resultImage = document.getElementById("resultImage");
const diagnosisText = document.getElementById("diagnosisResultText");

if (savedResult && diagnosisText) {
  diagnosisText.textContent = savedResult;
}
if (savedImage && resultImage) {
  resultImage.src = savedImage;
}
//result page
function addMessage(text, sender) {
  const chatBox = document.getElementById("chatMessages");
  if (!chatBox) return;

  const message = document.createElement("div");
  message.className = sender === "user" ? "message-user" : "message-bot";
  message.innerHTML = text;

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "user") {
    message.classList.add("message-user");
  } else {
    message.classList.add("message-bot");
  }
}
function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    let reply = "I can help you with pneumonia-related questions.";

    const lowerText = text.toLowerCase();

    if (savedResult === "NORMAL") {
      if (
        lowerText.includes("normal") ||
        lowerText.includes("healthy") ||
        lowerText.includes("safe")
      ) {
        reply =
          "Your X-ray result appears normal. No signs of Pneumonia were detected bu the AI model.However, if you still have symptoms like fever, cough, or chest pain, please consult a doctor.";
      } else if (
        lowerText.includes("symptom") ||
        lowerText.includes("cough") ||
        lowerText.includes("pain") ||
        lowerText.includes("fever")
      ) {
        reply =
          "Even with a normal X-ray result, some symptoms may still require medical attention.If symptoms continue or worsen, consult a healthcare professional.";
      } else if (
        lowerText.includes("advice") ||
        lowerText.includes("tips") ||
        lowerText.includes("prevent")
      ) {
        reply =
          "To keep your lungs healthy: drink enough water, avoid smoking, sleep well, eat healthy food, and exercise regularly.";
      } else {
        reply =
          "Your diagnosis result is normal. You can ask me about lung health, symptoms, prevention tips, or medical advice.";
      }
    } 
    else if (savedResult === "PNEUMONIA") {
      if (
        lowerText.includes("pneumonia") ||
        lowerText.includes("danger") ||
        lowerText.includes("serious")
      ) {
        reply =
          "The AI model detected possible signs of pneumonia. Pneumonia can become serious if ignored, so it is important to consult a doctor for proper medical evaluation.";
        }
      else if (
        lowerText.includes("treatment") ||
        lowerText.includes("medicine") ||
        lowerText.includes("cure")
      ) {
        reply =
          "Treatment depends on the severity and type of pneumonia. Doctors may prescribe antibiotics, rest, hydration, and other medications.";
      }
      else if (
        lowerText.includes("symptom") ||
        lowerText.includes("cough") ||
        lowerText.includes("pain") ||
        lowerText.includes("fever")
      ) {
        reply =
          "Common pneumonia symptoms include cough, fever, chills, chest pain, fatigue, and shortness of breath.";
      }
      else if (
        lowerText.includes("hospital") ||
        lowerText.includes("doctor") 
      ) {
        reply =
          "You should seek medical attention especially if breathing becoms difficult, fever is high, or symptoms continue worsening.";
      }
      else{
        reply = "Your result indicates possible pneumonia. You can ask about symptoms, treatment, recovery tips, or when to see a doctor.";
      }
    }
    else{
      reply = "Please upload and analyze an X-ray image first so Ican provide personalized assistance. ";
    }
    addMessage(reply, "bot");
  }, 600);
}
const chatInput = document.getElementById("chatInput");
if (chatInput) {
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });
}
window.sendChatMessage = sendChatMessage;
/*toast notification*/
const toast = document.getElementById("toast");
if (fileInput && toast) {
  fileInput.addEventListener("click", () => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  });
}
//team section
document.addEventListener("DOMContentLoaded", () => {
  const teamSection = document.querySelector(".team-section");
  window.addEventListener(
    "scroll",
    () => {
      const rect = teamSection.getBoundingClientRect();
      if (rect.top < window.innerHeight - 150 && rect.bottom > 150) {
        teamSection.classList.add("active");
      } else {
        teamSection.classList.remove("active");
      }
    },
    { passive: true },
  );

  const teamCards = document.querySelectorAll(".team-card");
  if (teamCards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(teamCards).indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add("show");
            }, index * 400);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    teamCards.forEach((card) => observer.observe(card));
  }
});
//faq section
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");
  if (question) {
    question.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  }
});
