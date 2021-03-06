let video = null

function ytGetVideo() {
    //get HTMLMediaElement to manipulate
    video = document.querySelector("video");

    //no resource
    if(video.readyState < 1) {     
        return false
    }
    
    return true
}

export {ytGetVideo}