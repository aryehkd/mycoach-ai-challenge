import { uploadVideoFile, writeFirestoreDocument, getCourses, getVideos } from "./firestore.js"
import { getVideoThumbnail } from "./thumbnail.js"

const writeVideoToFirestore = async () => {
    const file = document.getElementById('upload-video').files[0]

    const uploadTitle = document.getElementById('upload-title').value
    const uploadDescription = document.getElementById('upload-desc').value

    const cover = await getVideoThumbnail(file)

    const timestamp = new Date().getTime()

    const urls = await Promise.all([uploadVideoFile(file, uploadTitle, timestamp), uploadVideoFile(cover, uploadTitle+"-thumbnail", timestamp)])

    const activeCourse = document.getElementsByClassName("course_select active")?.[0]
    const courseName = activeCourse.innerText

    const videoUpload = {
        id: String(timestamp), 
        title: uploadTitle,
        description: uploadDescription,
        videoUrl: urls[0],
        thumbnailUrl: urls[1],
        courseName
    }

    writeFirestoreDocument("videos", String(timestamp), videoUpload)

    document.getElementById('upload-title').value = ""
    document.getElementById('upload-desc').value =""

    loadCourseVideos(courseName)
}

const loadCourseVideos = async (courseName) => {
    clearDisplayedVideos()

    const videos = await getVideos(courseName)


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

    return Promise.resolve()
}

const removeActiveCourseClass = () => {
    const courses = document.getElementsByClassName("course_select")

    Array.from(courses).forEach(course => course.className = "course_select")
}

const clearDisplayedVideos = () => {
    const courseItems = document.getElementsByClassName("course_item")

    Array.from(courseItems).forEach(courseItem => courseItem.parentNode.removeChild(courseItem))
}

const loadCourses = async () => {
    const courses = await getCourses()

    courses.forEach((course, index) => {
        const courseContainer = document.getElementById('courses')

        const courseTitle = document.createElement('h3')
        courseTitle.className = index === 0 ? "course_select active" : "course_select"
        courseTitle.id = "course-"+String(index)
        courseTitle.innerText = course?.courseName

        courseTitle.addEventListener('click', function(event) {
            removeActiveCourseClass()

            const active = document.getElementById(event.target.id)
            
            active.className = "course_select active"

            clearDisplayedVideos()
            loadCourseVideos(event.target.innerText)    


            document.getElementById('course-heading').value = active.innerText
        })

        courseContainer.appendChild(courseTitle)
    })   

    document.getElementById('course-heading').value = courses[0]?.courseName
}

const addCourse = () => {
    const courseContainer = document.getElementById('courses')

    const courseTitleInput = document.createElement('input')
    courseTitleInput.id = "course-title-input"
    courseTitleInput.className = "course_select active"

    document.getElementById('new-course').style.display = "none"

    removeActiveCourseClass()

    clearDisplayedVideos()

    courseTitleInput.addEventListener('keyup', async function(event) {
        if (event.key === 'Enter') {
            const newCourseName = document.getElementById('course-title-input').value

            await writeFirestoreDocument("courses", newCourseName, {courseName: newCourseName})

            document.getElementById('courses').innerHTML = ""

            await loadCourses()

            document.getElementById('new-course').style = "display: block"

            const reloadedCourses = document.getElementsByClassName("course_select")

            Array.from(reloadedCourses).forEach(course => {
                course.className = "course_select"
                if (course.innerText == newCourseName) 
                    course.className = "course_select active"
            })

            document.getElementById('course-heading').value = newCourseName

            loadCourseVideos(newCourseName)  
        }  

    })

    courseContainer.appendChild(courseTitleInput)
}

const uploadEl = document.getElementById("upload")
uploadEl.addEventListener('click', function () {
    try {
        writeVideoToFirestore()
    } catch (error) {
        console.error(error)
    }

}, false)


const newCourseEl = document.getElementById("new-course")
newCourseEl.addEventListener('click', function(event) {
    addCourse()
})


window.addEventListener('load', async function(event) {
    await loadCourses()

    const activeCourse = document.getElementById('courses')?.children[0]?.innerText??""
    loadCourseVideos(activeCourse)
})
