function ytGetVideo() {
    //get HTMLMediaElement to manipulate
    video = document.querySelector("video");
    //no resource
    if(video.readyState == 0) {     
        return false
    }
    else {
        video.addEventListener('ended', function(event) {
            chrome.runtime.sendMessage({from:"youtube_controller", message:"yt_video_end"});
        })
        return true
    }   
}

function ytInitVideoTime(thresholdTime) {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    video = document.querySelector("video")
    //if no time parameter indicates initial time then set video time to 0s
    if(!urlParams.has("t")) {
        if(video.currentTime > thresholdTime) {
            video.currentTime = 0
        }
    }
    return 
}

export {ytGetVideo, ytInitVideoTime}
