import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 1. Twoja Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNRAYPh0ncHCM2xOr2gQOk4YPDU1oYiOI",
    authDomain: "marta-prezent.firebaseapp.com",
    projectId: "marta-prezent",
    storageBucket: "marta-prezent.firebasestorage.app",
    messagingSenderId: "177881257053",
    appId: "1:177881257053:web:ddb2861cba4e01562ba9b4",
    measurementId: "G-LDWBXZ56Y1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- ODLICZANIE CZASU (Ustawione na 08:49) ---
const meetingDate = new Date('2026-10-17T08:49:00').getTime();
setInterval(function() {
    const now = new Date().getTime();
    const distance = meetingDate - now;
    if (distance < 0) {
        document.getElementById("countdown").innerHTML = "JUŻ SIĘ WIDZIMY! 🎉";
        return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById("countdown").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
}, 1000);

// --- GLOBALNE FUNKCJE UI ---
let currentAnswers = {}; 

window.nextSlide = function(slideNumber) {
    document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
    document.getElementById('slide-' + slideNumber).classList.add('active');
};

window.setMood = function(colorTheme, answerText, nextSlideNum) {
    document.getElementById('main-body').className = 'theme-' + colorTheme;
    currentAnswers['Q1'] = answerText;
    window.nextSlide(nextSlideNum);
};

window.saveAnswer = function(questionNumber, answerText) {
    currentAnswers['Q' + questionNumber] = answerText;
    window.nextSlide(questionNumber + 1);
};

// --- FUNKCJA WŁASNYCH ODPOWIEDZI ---
window.saveCustomAnswer = function(questionNumber, inputId) {
    const inputEl = document.getElementById(inputId);
    const answerText = inputEl.value.trim();
    
    if (answerText === "") {
        alert("Wpisz coś albo wybierz gotową odpowiedź! 😊");
        return;
    }

    if (questionNumber === 1) {
        document.getElementById('main-body').className = 'theme-pink';
        currentAnswers['Q1'] = answerText + ' ✍️';
        window.nextSlide(2);
    } 
    else if (questionNumber === 12) {
        window.finishQuiz(answerText + ' ✍️');
    } 
    else {
        currentAnswers['Q' + questionNumber] = answerText + ' ✍️';
        window.nextSlide(questionNumber + 1);
    }
};

window.finishQuiz = async function(answerText) {
    currentAnswers['Q12'] = answerText;
    currentAnswers['timestamp'] = new Date().toLocaleString('pl-PL');
    
    try {
        await setDoc(doc(db, "odpowiedzi", "marta"), currentAnswers);
        console.log("Zapisano pomyślnie w bazie!");
    } catch (e) {
        console.error("Błąd zapisu do bazy: ", e);
    }
    
    window.nextSlide(13);
};

// --- PANEL ADMINA ---
let clicks = 0;
window.triggerAdmin = function() {
    clicks++;
    if (clicks === 5) {
        clicks = 0;
        document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
        document.getElementById('slide-admin').classList.add('active');
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
};

window.checkPassword = async function() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === 'kocham') { // Hasło do admina
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        await loadAdminAnswers();
    } else {
        alert('Błędne hasło!');
    }
};

async function loadAdminAnswers() {
    const tbody = document.getElementById('admin-answers');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Ładowanie z chmury... ☁️</td></tr>';

    const pytania = [
        "1. Nastrój", "2. Pierwsze minuty", "3. Tęsknota", "4. Wspólny wieczór",
        "5. Wyjazd", "6. Kto zasypia", "7. Poprawa humoru", "8. Pierwszy film",
        "9. Czego brakuje", "10. Kiedy o mnie myśli", "11. Kiedy tęskni", "12. Niespodzianka"
    ];

    try {
        const docRef = doc(db, "odpowiedzi", "marta");
        const docSnap = await getDoc(docRef);

        tbody.innerHTML = ''; 
        if (docSnap.exists()) {
            const data = docSnap.data();
            const dataWypelnienia = data.timestamp ? data.timestamp : "Brak daty zapisu";
            
            tbody.innerHTML += `<tr><td colspan="2" style="text-align: center; font-size: 11px; color: #666; background: rgba(0,0,0,0.03);">Data wypełnienia: ${dataWypelnienia}</td></tr>`;
            
            for (let i = 1; i <= 12; i++) {
                const odp = data['Q' + i] || "Brak odpowiedzi";
                tbody.innerHTML += `<tr><td>${pytania[i-1]}</td><td>${odp}</td></tr>`;
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Marta jeszcze nie rozwiązała quizu!</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: red;">Błąd łączenia z bazą!</td></tr>';
        console.error("Błąd pobierania bazy:", e);
    }
}

// --- NAPRAWA SCROLLOWANIA NA LICIE DLA URZĄDZEŃ MOBILNYCH ---
document.addEventListener("DOMContentLoaded", function() {
    const letterBox = document.querySelector('.letter-content');
    if (letterBox) {
        letterBox.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
});