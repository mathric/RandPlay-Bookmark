let video = null

function getVideo() {
    //get HTMLMediaElement to manipulate
    video = document.querySelector("video");

    //no resource
    if(video.readyState < 1) {     
        return false
    }
    
    return true
}

export {getVideo}