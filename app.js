function $(elm) {
    return document.querySelector(elm);
}

function $all(elm) {
    return document.querySelectorAll(elm);
}

let recordScreenCont = $(".record-scr")
let selectScreenBtn = $(".select-screen");
let audioOption = $(".select-audio");
let timer = $(".timer");
let stopRec = $(".stop-record");
let videoScreen = $(".screen");
let vidscreenCont = $(".screen-cont");
let downloadBtn = $(".download-btn")

// timer stuff
let hr = 0;
let min = 0;
let sec = 0;
let stoptime = true;

let mimeType = "video/mp4";
let recordedChunks = [];
// After some time stop the recording by
let stream = "";

selectScreenBtn.onclick = async () => {
    stream = await recordScreen();
    startTimer()
    recordScreenCont.style.display = "none"
    vidscreenCont.style.display = "flex";

    const blob = new Blob(recordedChunks, {
        type: "video/mp4",
    });
    let url = URL.createObjectURL(blob)

    const video = document.createElement("video");
    video.width = 300;
    video.src = url
    videoScreen.appendChild(video)
};

stopRec.onclick = () => {
    let mediaRecorder = createRecorder(stream, mimeType);
    mediaRecorder.stop();
    console.log(stream);
};

downloadBtn.onclick = ()=>{
    const blob = new Blob(recordedChunks, {
        type: "video/mp4",
    });
    let url = URL.createObjectURL(blob)
    downloadVideo(url)
}

function startTimer() {
    if (stoptime == true) {
        stoptime = false;

        setInterval(() => {
            timerCycle();
        }, 10);
    }
}


function stopTimer() {
    // teraverse some dom
    recordScreenCont.style.display = "none"
    vidscreenCont.style.display = "flex";

    if (stoptime == false) {
        stoptime = true;
    }
}

function timerCycle() {
    if (stoptime === false) {
        sec = parseInt(sec);
        min = parseInt(min);
        hr = parseInt(hr);

        sec += 1;

        if (sec == 60) {
            min += 1;
            sec = 0;
        }

        if (min == 60) {
            hr += 1;
            min = 0;
            sec = 0;
        }

        if (sec < 10 || sec == 0) {
            sec = "0" + sec;
        }
        if (min < 10 || min == 0) {
            min = "0" + min;
        }
        if (hr < 10 || hr == 0) {
            hr = "0" + hr;
        }

        timer.innerHTML = `
        ${hr}:${min}:${sec}
    `;
    }
}


function downloadVideo(){
    saveFile(recordedChunks)
}

async function recordScreen() {
    return await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: { mediaSource: "screen" },
    });
}

function createRecorder(stream, mimeType) {
    // the stream data is stored in this array

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    mediaRecorder.onstop = function () {
        stopTimer()
    };
    mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
    console.log(mediaRecorder);
    return mediaRecorder;
}

function saveFile(recordedChunks) {
    const blob = new Blob(recordedChunks, {
        type: "video/mp4",
    });
    let filename = window.prompt("Enter file name"),
    downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.mp4`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(blob); // clear from memory
    document.body.removeChild(downloadLink);
}
