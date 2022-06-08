
let Stream, Video, Canvas, Ctx, Detector;

function add(a, b) {
    return a + b;
}

async function getCameraPermission() {
    Stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}

async function getListOfCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => {
        d.kind === 'videoinput';
        return d.kind === 'videoinput';
    })

    return videoDevices;
}

async function setCamera(device) {
    Stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
}

async function createVideo(Id) {
    let video = document.createElement('video');
    video.setAttribute('id', Id);
    document.body.appendChild(video);
    video.style.transform = 'scaleX(-1)';
    video.srcObject = Stream;
    video.autoplay = true;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            resolve(video);
        };
        Video = video;
    });
}

function createDisplay(Id) {
    let canvas = document.createElement("canvas")
    canvas.setAttribute('id', Id);
    document.body.appendChild(canvas);
    Canvas = canvas
    if (Video != null) {
        canvas.height = Video.height;
        canvas.width = Video.width;
        Canvas = canvas;
        var ctx = canvas.getContext('2d');
        if (ctx != null) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.fillStyle = "green";
            Ctx = ctx;
            return canvas
        }
        else {
            console.log('canvas.getContext(\'2d\') return null');
            return canvas
        }
    }
    else { console.log('Undefined Property \"Video\"'); }
}

// Need to test this out
function setDisplay(canvas) {
    let video = Video;
    Canvas = canvas;
    if ((canvas != undefined) && (video != undefined)) {
        canvas.height = video.height
        canvas.width = video.width
        var ctx = canvas.getContext('2d');
        if (ctx != null) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.fillStyle = "green";
        }
        Ctx = ctx;
    }
    else { console.log('/"Canvas/", /"Video/" Undefined'); }
}

function showDisplay() {
    let ctx = Ctx;
    let video = Video;
    if ((ctx != undefined) && (video != undefined)) {
        ctx.drawImage(video, 0, 0)
    }
    else { console.log('\"Ctx\", \"Video\" Undefined') }
}

function hideDisplay(canvas) {
    canvas.style.visibility = 'hidden'
}

async function createOverlay() {

    try {
        let ctx = Ctx;
        let video = Video;
        let detector = Detector;

        if ((detector != undefined) && (video != undefined) && (ctx != undefined)) {

            const coordinates = (await detector.estimateFaces(video))[0];
            const boxCoords = coordinates.box;
            const keypoints = coordinates.keypoints;
            ctx.drawImage(video, 0, 0)
            for (let keypoint = 468; keypoint < keypoints.length; keypoint++) {
                const x = keypoints[keypoint]['x']
                const y = keypoints[keypoint]['y']

                ctx.beginPath();
                ctx.rect(x, y, 2, 2);
                ctx.stroke();
            }
            window.requestAnimationFrame(await createOverlay());
        }
        else { console.log('\"this.detector\", \"Video\", \"Ctx\" Undefined'); }
    }
    catch (err) { showDisplay(); window.requestAnimationFrame(await createOverlay()); }
}

async function init() {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
    };
    const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    Detector = detector
    return detector
}

async function isFaceValid() {
    let detector = Detector;
    let video = Video;
    if ((detector != undefined) && (video != undefined)) {
        const faces = await detector.estimateFaces(video, { flipHorizontal: true })
        if (faces.length > 0) {
            console.log('FACE DETECTED');
            console.log(faces)
        }
        else { console.log('Waiting for faces...') }
        window.setInterval(await isFaceValid());
    }
    else { console.log('\"this.detector\", \"Video\" Undefined') }
}

async function cameraSetup() {
    try {
        await getCameraPermission();
        console.log("Permission Acquired...");

        const test = await getListOfCameras();
        console.log("List of Cameras Acquired...");

        await setCamera(await test[0]);
        console.log("Source Object Captured...");

        await createVideo("test video");
        //console.log(await createVideo('test video'));
        console.log("Video Element Created...");

        await createDisplay("test canvas");
        //console.log(await createDisplay('test canvas'));
        console.log("Canvas Element Created...");

        await init();
        //console.log(await init())
        console.log("Detector Created...");

        createOverlay();

        // hideDisplay(document.getElementById('test canvas'))

        // isFaceValid();
    } catch (err) {
        console.log("An error has been detected: " + err);
    }
}

cameraSetup();