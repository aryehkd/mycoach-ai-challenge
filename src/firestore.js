const firebaseConfig = {
    apiKey: "<FIREBASE API KEY HERE>",
    authDomain: "mycoachai-code-assignment.firebaseapp.com",
    projectId: "mycoachai-code-assignment",
    storageBucket: "mycoachai-code-assignment.appspot.com",
    messagingSenderId: "195035549126",
    appId: "1:195035549126:web:14ac151adb25672931b6c7",
    measurementId: "G-SZDMXH7N5B"
}

const app = firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()

export const uploadVideoFile = (file, uploadTitle, timestamp) => {
    const ref = firebase.storage().ref()

    const metadata = {
        contentType: file.type
    }

    const fileName = uploadTitle + "-" + timestamp

    const imageRef = ref.child(fileName).put(file, metadata)
    
    return imageRef
        .then(snapshot => snapshot.ref.getDownloadURL())
        .catch(error => {throw error})
}

export const writeFirestoreDocument = async (collection, documentID, document) => 
    await db.collection(collection).doc(documentID).set(document)

export const getCourses = async () => 
    await db.collection("courses").get()
        .then((querySnapshot) => {
            const courses = []

            querySnapshot.forEach((doc) => {
                courses.push({...doc.data()})
            })
            
            return courses
        })
        .catch((error) => {
            console.error("Error getting documents: ", error)
        })


export const getVideos = async (courseName) => 
    await db.collection("videos").where("courseName", "==", courseName).get()
        .then((querySnapshot) => {
            const videos = []

            querySnapshot.forEach((doc) => {
                videos.push({...doc.data()})
            })

            return videos
        })
        .catch((error) => {
            console.error("Error getting documents: ", error)
        })
