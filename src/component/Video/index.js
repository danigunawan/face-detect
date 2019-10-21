import React, { useEffect } from 'react';
import * as faceapi from 'face-api.js';


function Video() {

  const getNameLabel = () => {
    const listLabels = ['Tuan Anh']
    return Promise.all(
      listLabels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/nguyentuananhc/face-detect/master/detect-image/${label}/${i}.jpg`)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
      })
    )
  }

  useEffect(() => {
    const video = document.getElementById('video')
    const constraints = {
      video: true
    };

    function handleSuccess(stream) {
      window.stream = stream; // only to make stream available to console
      video.srcObject = stream;
    }

    function handleError(error) {
      console.log('getUserMedia error: ', error);
    }

    const startVideo = () => {
      if (!video) return
      navigator.mediaDevices.getUserMedia(constraints).
        then(handleSuccess).catch(handleError);
    }
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]).then(startVideo).catch((err) => console.log(err))

    video.addEventListener('play', async () => {
      const canvas = faceapi.createCanvasFromMedia(video)
      const labeledFaceDescriptors = await getNameLabel()
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.7)
      document.body.append(canvas)
      const displaySize = { width: video.width, height: video.height }
      faceapi.matchDimensions(canvas, displaySize)
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor)
        )
        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
          drawBox.draw(canvas)
        })

        // faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      }, 100)
    })

  }, [])

  return (
    <video id="video" width="620" height="340" autoPlay muted></video>
  );
}

export default Video;
