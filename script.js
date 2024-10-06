// Fungsi untuk memperbarui waktu setiap detik
function updateTime() {
    const sekarang = new Date();
    const tanggal = sekarang.toLocaleDateString('id-ID');
    const waktu = sekarang.toLocaleTimeString('id-ID');
    document.getElementById('waktu').innerHTML = `Tanggal: ${tanggal} | Waktu: ${waktu}`;
}

setInterval(updateTime, 1000);
updateTime();

const video = document.getElementById('videoElement');
const captureButton = document.getElementById('captureButton');
const cameraSelector = document.getElementById('cameraSelector');
const canvas = document.getElementById('canvasElement');
const genderDisplay = document.getElementById('gender');
const ageDisplay = document.getElementById('age');
const faceStatusDisplay = document.getElementById('faceStatus');
const temperatureDisplay = document.getElementById('temperature');

let currentStream;

// Fungsi untuk memulai kamera
function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            currentStream = stream;
            captureButton.style.display = 'inline';
        })
        .catch(err => {
            console.error("Error accessing the camera: " + err);
        });
}

// Fungsi untuk mendapatkan daftar kamera
function getCameras() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            cameraSelector.innerHTML = '';
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Jika tidak ada kamera ditemukan
            if (videoDevices.length === 0) {
                alert('Tidak ada kamera yang ditemukan.');
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Kamera ${index + 1}`;
                cameraSelector.appendChild(option);
            });

            // Memulai kamera dengan kamera pertama di daftar
            startCamera(videoDevices[0].deviceId);
            cameraSelector.value = videoDevices[0].deviceId; // Set default option
        })
        .catch(err => {
            console.error("Error enumerating devices: " + err);
        });
}

// Fungsi untuk menganalisis warna kulit
function analyzeSkinTone(imageData) {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        const averageBrightness = (r + g + b) / 3;
        if (averageBrightness < 200) {
            faceStatusDisplay.textContent = 'Pucat'; // Jika rata-rata kecerahan rendah
        } else {
            faceStatusDisplay.textContent = 'Sehat'; // Jika rata-rata kecerahan tinggi
        }
    };
}

// Fungsi untuk mengirim data ke Face API
function sendToFaceAPI(imageBase64) {
    const apiKey = 'p375lNDRr9BP_U6tyShT0Dr7DTYaq71Y'; 
    const apiSecret = 'aUZX1RKKiL5nYcbGh1lvzuliQCT8n1q4'; 
    const url = `https://api-us.faceplusplus.com/facepp/v3/detect`;

    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('api_secret', apiSecret);
    formData.append('image_base64', imageBase64.split(',')[1]);
    formData.append('return_attributes', 'age,gender');

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.faces.length > 0) {
            const faceData = data.faces[0];
            genderDisplay.textContent = faceData.attributes.gender.value;
            ageDisplay.textContent = faceData.attributes.age.value;
        }
    })
    .catch(err => {
        console.error('Error detecting face: ', err);
    });
}

// Fungsi untuk menangkap foto dari video
function capturePhoto() {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/png');
    sendToFaceAPI(photoData);
    analyzeSkinTone(photoData); // Analisis warna kulit untuk status wajah

    // Simulasi suhu
    temperatureDisplay.textContent = (36 + Math.random() * 2).toFixed(1); // Suhu antara 36°C dan 38°C
}

// Event listener untuk tombol Capture Foto
captureButton.addEventListener('click', capturePhoto);

// Event listener untuk pemilihan kamera
cameraSelector.addEventListener('change', (event) => {
    startCamera(event.target.value);
});

// Memulai pencarian kamera
getCameras();
