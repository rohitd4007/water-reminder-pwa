let timerId;
let timeoutId;
let userConfirmed = false;
let isFirstReminder = true;

// Function to schedule next reminder
function scheduleNextReminder() {
    const interval = parseInt(document.getElementById("interval").value);
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
        if (!userConfirmed) {
            showReminder();
        }
    }, interval * 60 * 1000);
}

let soundPlaying = false;

function showReminder() {
    if (Notification.permission === "granted" && !userConfirmed) {
        const sound = document.getElementById("reminder-sound");

        if (!soundPlaying) {
            sound.play().then(() => {
                soundPlaying = true;
            }).catch(() => {
                soundPlaying = false;
            });
        }

        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.showNotification("💧 Time to drink water!", {
                    body: "Click 'I did!' after drinking.",
                    icon: "https://img.icons8.com/fluency/96/water-bottle.png",
                    actions: [{ action: "confirm", title: "I did!" }],
                    tag: "drink-reminder",
                    renotify: true
                });
            }
        });
    }
}


document.getElementById("start").addEventListener("click", () => {
    const interval = parseInt(document.getElementById("interval").value);
    if (isNaN(interval) || interval <= 0) {
        alert("Please enter a valid number");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            userConfirmed = false;
            isFirstReminder = true;
            clearInterval(timerId);
            clearTimeout(timeoutId);

            // Schedule the first reminder
            scheduleNextReminder();

            document.getElementById("status").textContent = `Reminders started every ${interval} minutes. First reminder in ${interval} minutes.`;
        } else {
            alert("Please allow notifications.");
        }
    });
});

document.getElementById("stop").addEventListener("click", () => {
    clearInterval(timerId);
    clearTimeout(timeoutId);
    userConfirmed = true;
    isFirstReminder = true;
    document.getElementById("status").textContent = "Reminders stopped.";
});

navigator.serviceWorker.addEventListener("message", event => {
    const sound = document.getElementById("reminder-sound");

    if (event.data.type === "STOP_SOUND") {
        if (!sound.paused) {
            sound.pause();
            sound.currentTime = 0;
            soundPlaying = false;
        }
    } else if (event.data.type === "DRANK_CONFIRMED") {
        userConfirmed = false;
        isFirstReminder = false;

        const interval = parseInt(document.getElementById("interval").value);
        scheduleNextReminder();
        document.getElementById("status").textContent = `Thanks! Next reminder in ${interval} minutes.`;
    }
});


// Register service worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("Service Worker registered.");
    });
}
