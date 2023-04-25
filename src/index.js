const firebaseConfig = {
    apiKey: "AIzaSyD10s9TNvVnZDETCZ3WPDNWYNlT1czpjBs",
    authDomain: "mycoachai-code-assignment.firebaseapp.com",
    projectId: "mycoachai-code-assignment",
    storageBucket: "mycoachai-code-assignment.appspot.com",
    messagingSenderId: "195035549126",
    appId: "1:195035549126:web:14ac151adb25672931b6c7",
    measurementId: "G-SZDMXH7N5B"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const uploadVideoFile = (file, uploadTitle, timestamp) => {
    const ref = firebase.storage().ref();

    const metadata = {
        contentType: file.type
    };

    const fileName = uploadTitle + "-" + timestamp

    const imageRef = ref.child(fileName).put(file, metadata);
    
    return imageRef
        .then(snapshot => snapshot.ref.getDownloadURL())
        .catch(error => {throw error;});
}

function getVideoThumbnail(file, seekTo = 0.0) {
    return new Promise((resolve, reject) => {
        // load the file to a video player
        const videoPlayer = document.createElement('video');
        videoPlayer.setAttribute('src', URL.createObjectURL(file));
        videoPlayer.load();
        videoPlayer.addEventListener('error', (ex) => {
            reject("error when loading video file", ex);
        });
        // load metadata of the video to get video duration and dimensions
        videoPlayer.addEventListener('loadedmetadata', () => {
            // seek to user defined timestamp (in seconds) if possible
            if (videoPlayer.duration < seekTo) {
                reject("video is too short.");
                return;
            }
            // delay seeking or else 'seeked' event won't fire on Safari
            setTimeout(() => {
              videoPlayer.currentTime = seekTo;
            }, 200);
            // extract video thumbnail once seeking is complete
            videoPlayer.addEventListener('seeked', () => {
                // define a canvas to have the same dimension as the video
                const canvas = document.createElement("canvas");
                canvas.width = videoPlayer.videoWidth;
                canvas.height = videoPlayer.videoHeight;
                // draw the video frame to canvas
                const ctx = canvas.getContext("2d");
                ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
                // return the canvas image as a blob
                ctx.canvas.toBlob(
                    blob => {
                        resolve(blob);
                    },
                    "image/jpeg",
                    0.75 /* quality */
                );
            });
        });
    });
}

const writeVideoToFirestore = async () => {
    const file = document.getElementById('upload-video').files[0];

    const uploadTitle = document.getElementById('upload-title').value;
    const uploadDescription = document.getElementById('upload-desc').value;

    const cover = await getVideoThumbnail(file)

    const timestamp = new Date().getTime()

    const urls = await Promise.all([uploadVideoFile(file, uploadTitle, timestamp), uploadVideoFile(cover, uploadTitle+"-thumbnail", timestamp)])

    const videoUpload = {
        id: String(timestamp), 
        title: uploadTitle,
        description: uploadDescription,
        videoUrl: urls[0],
        thumbnailUrl: urls[1],
        courseName: '' // TODO: add active course name here
    }

    db.collection("videos").doc(String(timestamp)).set(videoUpload)
    console.log('done')
}

const uploadEl = document.getElementById("upload");

uploadEl.addEventListener('click', function () {
    try {
        writeVideoToFirestore()
    } catch (error) {
        console.error(error)
    }

}, false);

const loadCourseVideos = async (courseName) => {

    const videos = await db.collection("videos").where("courseName", "==", courseName).get()
        .then((querySnapshot) => {
            const videos = []

            querySnapshot.forEach((doc) => {
                videos.push({...doc.data()})
            });

            return videos
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });


    videos.forEach((video, index) => {
        const videosContainer = document.getElementsByClassName("col-65")?.[0]

        const courseItem = document.createElement('div') 
        courseItem.id = "course-item-"+String(index)
        courseItem.className = 'course_item' 
    
        const position = document.createElement('p')
        position.className = 'position'
        position.innerText = String(index + 1)
        courseItem.appendChild(position)
    
        const thumbnail = document.createElement('img')
        thumbnail.className = "thumb"
        thumbnail.src = video?.thumbnailUrl  
        courseItem.appendChild(thumbnail)
    
        const courseDetails = document.createElement('div')  
        courseDetails.className = 'course_details'
    
        const videoTitle = document.createElement('h3')
        videoTitle.innerText = video?.title
        courseItem.appendChild(videoTitle)
    
        const videoDescription = document.createElement('p')
        videoDescription.innerText = video?.description
        courseItem.appendChild(videoDescription)
    
        courseItem.appendChild(courseDetails)
    
        videosContainer.appendChild(courseItem)
    })
}

const loadCourses = async () => {
    const courses = await db.collection("courses").get()
        .then((querySnapshot) => {
            const courses = []

            querySnapshot.forEach((doc) => {
                courses.push({...doc.data()})
            });

            return courses
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });

    courses.forEach((course, index) => {
        const courseContainer = document.getElementById('courses')

        const courseTitle = document.createElement('h3')
        courseTitle.className = index === 0 ? "course_select active" : "course_select"
        courseTitle.id = "course-"+String(index)
        courseTitle.innerText = course?.courseName

        courseTitle.addEventListener('click', function(event) {
            const courses = document.getElementsByClassName("course_select")

            Array.from(courses).forEach(course => course.className = "course_select")

            const active = document.getElementById(event.target.id)
            
            active.className = "course_select active"

            const courseItems = document.getElementsByClassName("course_item")

            Array.from(courseItems).forEach(courseItem => courseItem.parentNode.removeChild(courseItem))

            loadCourseVideos(active.innerText)
        });

        courseContainer.appendChild(courseTitle)
    })

    loadCourseVideos(courses[0]?.courseName)
}

const courseEl = document.getElementById("upload");

window.addEventListener('load', function(event) {
    loadCourses()
});
