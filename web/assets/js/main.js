import { Signup } from "./auth.js"
import { createPost } from "./post.js"
import { authTemplate,  createPostForm,  feeds } from "./templates.js"

export function Feeds() {

let body = document.getElementById("app")
body.innerHTML = feeds()

let Createpost = document.getElementById("createpost")

Createpost.addEventListener("click", ()=>{
    
    body.innerHTML = createPostForm()

    let post = document.getElementById("create")
    

    post.addEventListener("click", ()=>{
        console.log("clicked1");
        
        createPost()
    })
    
})  

  
}
document.addEventListener('DOMContentLoaded', ()=>{
    if (IsCookiesPresent()){
        Feeds()

    }else{
        console.log(document.cookie);

        document.getElementById("app").innerHTML = authTemplate()
        document.getElementById("signup").addEventListener("click", ()=>{
            console.log("clicked");
            Signup()

        })

    }

})

function IsCookiesPresent() {
    return getCookie("session_id") !== null
}
function getCookie(name) {
    console.log(document.cookie);
    
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    if (match) return match[2]
    return null
}
