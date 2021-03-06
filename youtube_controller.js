const INIT_PLAY_TIME_THRESHOLD = 5

function ytGetVideo() {
    //get HTMLMediaElement to manipulate
    video = document.querySelector("video");
    //no resource
    if(video.readyState == 0) {     
        return false
    }
    else {
        return true
    }   
}

function ytInitVideoTime(video) {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    video = document.querySelector("video")
    //if no time parameter indicates initial time then set video time to 0s
    if(!urlParams.has("t")) {
        if(video.currentTime > INIT_PLAY_TIME_THRESHOLD) {
            video.currentTime = 0
        }
    }
    return 
}

export {ytGetVideo, ytInitVideoTime}