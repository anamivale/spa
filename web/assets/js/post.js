import { Feeds } from "./feeds.js"

export function createPost() {
    let fileInput = document.getElementById("file")
    let title = document.getElementById("title").value
    let content  = document.getElementById("content").value
    let selectedCat = document.querySelectorAll('input[name="category"]:checked')

    let categories = Array.from(selectedCat).map(cat => cat.value)
    console.log(content)

    let req = {
        title: title,
        content : content,
        categories: categories
    }

    if (fileInput.files.length !== 0){
        REadFileContent(fileInput).then(({ file, fileContent }) => {
            if (content) {
                req["filename"] = file
                req["filecontent"] = fileContent
            }

            sendRequest(req)
    
    
        }).catch(err => {
            console.error("File reading error:", err)
        })
    } else {
        sendRequest(req)
    }

    
}


function REadFileContent(input){
    return new Promise((resolve, reject)=>{
        const file = input.files[0]
        if (!file ){
            return resolve({file:null, fileContent:null})
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const filecontent = e.target.result
            resolve({file:file.name, fileContent: filecontent})
            
        }
        reader.onerror = function (e){
            reject(e)
        }
        reader.readAsDataURL(file)
    })

}


function sendRequest(req) {
    fetch("/post", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(req)
    })
    .then(res => res.json())
    .then(data => {
        if (data.type == "success") {
            Feeds()
        }
        alert(data.type)
    })
    .catch(err => {
        console.log(err.message);
    })
}