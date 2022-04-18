const { writeFile } = require('fs');
const { ipcRenderer } = require('electron')

const desktopCapturer = {
    getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
}

// const { dialog, Menu } = remote;


function $(elm) {
    return document.querySelector(elm);
}

function $all(elm) {
    return document.querySelectorAll(elm);
}

let shouldStop = false;
let stopped = false;
let mediaRecorder;
const recordedChunks = [];

let btnInfo = $(".btn-info")
const videoElement = $(".record-video")
const downloadLink = $("#download");
const stopButton = $("#stop");
const audioElem = $(".audio-elm")
const videoSourceBtn = $(".videoSource")
const screenRecordBtn = $(".screen-record-btn")

screenRecordBtn.onclick = () => {
    recordScreen()
}

videoSourceBtn.onclick = (e) => {
    // get windows screen
    getVideoSource()
}

async function getVideoSource() {
    let inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    })

    const videoOptionsMenu = electron.remote.Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => recordScreen(source)
            };
        })
    );


    videoOptionsMenu.popup();
}

function startRecord() {
    btnInfo.setAttribute("disabled", true)
    stopButton.removeAttribute("disabled")
    downloadLink.style.display = "none"
}
function stopRecord() {
    btnInfo.setAttribute("disabled", false)
    stopButton.setAttribute("disabled", true)
    downloadLink.style.display = "block"
}

const audioRecordConstraints = {
    echoCancellation: true,
};

stopButton.addEventListener("click", function () {
    shouldStop = true;
});

async function recordAudio() {
    const mimeType = "audio/webm";
    shouldStop = false;
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioRecordConstraints,
    });
    handleRecord({ stream, mimeType });
}


const handleRecord = function ({ stream, mimeType }) {
    startRecord();
    let recordedChunks = [];
    stopped = false;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }

        if (shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
        }
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(recordedChunks, {
            type: mimeType,
        });
        recordedChunks = [];
        const filename = window.prompt("Enter file name");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename || "recording"}.webm`;
        stopRecord();
        videoElement.srcObject = null;
    };

    mediaRecorder.start(200);
};


async function recordVideo() {
    const mimeType = "video/webm";
    shouldStop = false;
    const constraints = {
        audio: {
            echoCancellation: true,
        },
        video: {
            width: {
                min: 640,
                max: 1024,
            },
            height: {
                min: 480,
                max: 768,
            },
        },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    audioElem.src = stream
    handleRecord({ stream, mimeType });
}

async function recordScreen(source) {
    videoSourceBtn.removeAttribute("disabled")
    return
    const mimeType = "video/webm";
    shouldStop = false;
    const constraints = {
        audio: true,
        video: {
            cursor: "motion",
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        },
    };

    // create stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;




    // let stream = null;
    // const displayStream = await navigator.mediaDevices.getDisplayMedia({
    //     video: { cursor: "motion" },
    //     audio: { echoCancellation: true },
    // });


    // if (window.confirm("Record audio with screen?")) {
    //     const audioContext = new AudioContext();

    //     const voiceStream = await navigator.mediaDevices.getUserMedia({
    //         audio: { echoCancellation: true },
    //         video: false,
    //     });
    //     const userAudio = audioContext.createMediaStreamSource(voiceStream);

    //     const audioDestination = audioContext.createMediaStreamDestination();
    //     userAudio.connect(audioDestination);

    //     if (displayStream.getAudioTracks().length > 0) {
    //         const displayAudio = audioContext.createMediaStreamSource(displayStream);
    //         displayAudio.connect(audioDestination);
    //     }

    //     const tracks = [
    //         ...displayStream.getVideoTracks(),
    //         ...audioDestination.stream.getTracks(),
    //     ];
    //     stream = new MediaStream(tracks);
    //     handleRecord({ stream, mimeType });
    // } else {
    //     stream = displayStream;
    //     handleRecord({ stream, mimeType });
    // }
    // videoElement.srcObject = stream;
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}