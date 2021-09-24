let root_folder = document.getElementById("root_folder");
let directoryUnfoldState = new Map();

chrome.bookmarks.getTree(function (TreeNodes) {
    createDynamicList(TreeNodes[0], root_folder);
});

function createDynamicList(node, htmlParent) {
    //check if it is directory
    if (node.hasOwnProperty("children")) {
        let child_list = document.createElement("ul");
        for (let i = 0; i < node.children.length; i++) {
            let child = null

            if (node.children[i].hasOwnProperty("children")) {
                child = document.createElement("ul");
                child.addEventListener("click", function (e) {
                    // let cur_unfold_state = directoryUnfoldState[node.children[i].id];

                    // if (cur_unfold_state === undefined || !cur_unfold_state) {
                    //     createDynamicList(node.children[i], child);
                    //     directoryUnfoldState[node.children[i].id] = true;
                    // }
                    foldClickHandler(node.children[i], child)

                    e.stopPropagation();
                });
            }
            else {
                child = document.createElement("li");
            }
            child.textContent = node.children[i].title;
            child_list.appendChild(child);
        }
        htmlParent.appendChild(child_list);
    }
}

function foldClickHandler(node, curElement) {
    let cur_unfold_state = directoryUnfoldState[node.id];

    //unfold it 
    if (cur_unfold_state === undefined || !cur_unfold_state) {
        createDynamicList(node, curElement);
        directoryUnfoldState[node.id] = true;
    }
    else{
        //fold it(remove all child)
        console.log(curElement)
        while (curElement.firstChild) {
            console.log(curElement.firstChild)
            curElement.removeChild(curElement.lastChild);
        }
    }
}
