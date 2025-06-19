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
    console.log("showReminder called");
    if (Notification.permission === "granted" && !userConfirmed) {
        const sound = document.getElementById("reminder-sound");
        console.log("About to play sound. soundPlaying:", soundPlaying, "sound.paused:", sound.paused);

        if (!soundPlaying) {
            sound.play().then(() => {
                soundPlaying = true;
                console.log("Sound started playing");
            }).catch((err) => {
                soundPlaying = false;
                console.log("Sound play failed:", err);
            });
        } else {
            console.log("Sound already playing, not playing again.");
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
                console.log("Notification shown with 'I did!' action");
            } else {
                console.log("No service worker registration found");
            }
        });
    } else {
        console.log("Notification permission not granted or user already confirmed");
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
            console.log("Reminders started");
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
    console.log("Reminders stopped");
});

navigator.serviceWorker.addEventListener("message", event => {
    const sound = document.getElementById("reminder-sound");
    console.log("Service worker message received:", event.data);

    if (event.data.type === "STOP_SOUND") {
        console.log("STOP_SOUND received. sound.paused:", sound.paused, "sound.currentTime:", sound.currentTime, "soundPlaying:", soundPlaying);
        if (!sound.paused || soundPlaying) {
            sound.pause();
            sound.currentTime = 0;
            soundPlaying = false;
            console.log("Sound stopped and reset.");
        } else {
            console.log("Sound already paused.");
        }
    } else if (event.data.type === "DRANK_CONFIRMED") {
        console.log("DRANK_CONFIRMED received");
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

self.addEventListener("notificationclick", function (event) {
    console.log("Notification click event:", event.action);
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientsArr => {
            let focused = false;
            for (let client of clientsArr) {
                // Focus the first visible client
                if ('focus' in client) {
                    client.focus();
                    focused = true;
                }
                // Send message to stop sound
                client.postMessage({ type: "STOP_SOUND" });
                setTimeout(() => {
                    client.postMessage({ type: "DRANK_CONFIRMED" });
                }, 100);
            }
            // If no client is open, optionally open a new window (optional)
            if (!focused && self.clients.openWindow) {
                return self.clients.openWindow('./');
            }
        })
    );
});
