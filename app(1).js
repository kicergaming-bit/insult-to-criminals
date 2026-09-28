import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// =====================================
// SUPABASE
// =====================================

const SUPABASE_URL =
    "https://tvpfnioocropfimsfbwb.supabase.co/rest/v1/";

const SUPABASE_KEY =
    "9c1ecae3ba937a3a2142e12aa7354ed2f7b4b339";


const supabase =
    createClient(
        https://tvpfnioocropfimsfbwb.supabase.co/rest/v1/,
        9c1ecae3ba937a3a2142e12aa7354ed2f7b4b339
    );


// =====================================
// ELEMENT
// =====================================

const loginBtn =
    document.getElementById("loginBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const loginPanel =
    document.getElementById("loginPanel");

const ownerPanel =
    document.getElementById("ownerPanel");

const loginSubmit =
    document.getElementById("loginSubmit");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginStatus =
    document.getElementById("loginStatus");

const photoInput =
    document.getElementById("photoInput");

const uploadBtn =
    document.getElementById("uploadBtn");

const uploadStatus =
    document.getElementById("uploadStatus");

const gallery =
    document.getElementById("gallery");


// =====================================
// LOGIN PANEL
// =====================================

loginBtn.onclick = () => {

    loginPanel.classList.toggle("hidden");

};


// =====================================
// LOGIN
// =====================================

loginSubmit.onclick = async () => {

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    loginStatus.textContent =
        "Logging in...";


    const {
        error
    } = await supabase.auth.signInWithPassword({

        email,
        password

    });


    if (error) {

        loginStatus.textContent =
            "Login gagal: " + error.message;

        return;

    }


    loginStatus.textContent =
        "Login berhasil.";

    loginPanel.classList.add("hidden");

    updateUI();

    loadPhotos();

};


// =====================================
// LOGOUT
// =====================================

logoutBtn.onclick = async () => {

    await supabase.auth.signOut();

    updateUI();

    loadPhotos();

};


// =====================================
// CHECK LOGIN
// =====================================

async function updateUI() {

    const {
        data
    } = await supabase.auth.getUser();


    const user = data.user;


    if (user) {

        loginBtn.classList.add("hidden");

        logoutBtn.classList.remove("hidden");

        ownerPanel.classList.remove("hidden");

    } else {

        loginBtn.classList.remove("hidden");

        logoutBtn.classList.add("hidden");

        ownerPanel.classList.add("hidden");

    }

}


// =====================================
// UPLOAD FOTO
// =====================================

uploadBtn.onclick = async () => {

    const file =
        photoInput.files[0];


    if (!file) {

        uploadStatus.textContent =
            "Pilih foto dulu.";

        return;

    }


    const {
        data
    } = await supabase.auth.getUser();


    if (!data.user) {

        uploadStatus.textContent =
            "Lo bukan owner.";

        return;

    }


    uploadStatus.textContent =
        "Uploading...";


    const filename =
        Date.now() + "-" + file.name;


    const {
        error: uploadError
    } = await supabase.storage
        .from("photos")
        .upload(filename, file);


    if (uploadError) {

        uploadStatus.textContent =
            uploadError.message;

        return;

    }


    const {
        data: publicData
    } =
        supabase.storage
        .from("photos")
        .getPublicUrl(filename);


    const imageURL =
        publicData.publicUrl;


    const {
        error: databaseError
    } =
        await supabase
        .from("photos")
        .insert({

            filename: filename,

            image_url: imageURL,

            owner_id: data.user.id

        });


    if (databaseError) {

        uploadStatus.textContent =
            databaseError.message;

        return;

    }


    uploadStatus.textContent =
        "Foto berhasil diupload.";

    photoInput.value = "";

    loadPhotos();

};


// =====================================
// LOAD PHOTOS
// =====================================

async function loadPhotos() {

    gallery.innerHTML =
        "Loading...";


    const {
        data: photos,
        error
    } =
        await supabase
        .from("photos")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        gallery.innerHTML =
            error.message;

        return;

    }


    gallery.innerHTML = "";


    for (const photo of photos) {

        await createPost(photo);

    }

}


// =====================================
// CREATE POST
// =====================================

async function createPost(photo) {

    const post =
        document.createElement("article");

    post.className =
        "post";


    const {
        data
    } = await supabase.auth.getUser();


    const isOwner =
        data.user &&
        data.user.id === photo.owner_id;


    post.innerHTML = `

        <img
            src="${photo.image_url}"
            alt="Foto"
        >

        <div class="post-content">

            ${
                isOwner
                ?
                `<button
                    class="delete-btn"
                    data-id="${photo.id}">
                    Hapus Foto
                </button>`
                :
                ""
            }

            <div
                class="comments"
                id="comments-${photo.id}">
            </div>

            <div class="comment-box">

                <input
                    type="text"
                    placeholder="Tulis komentar..."
                    maxlength="500"
                    id="input-${photo.id}"
                >

                <button
                    onclick="addComment(${photo.id})">
                    Kirim
                </button>

            </div>

        </div>
    `;


    gallery.appendChild(post);


    if (isOwner) {

        const deleteButton =
            post.querySelector(".delete-btn");


        deleteButton.onclick =
            () => deletePhoto(photo);

    }


    loadComments(photo.id);

}


// =====================================
// DELETE PHOTO
// =====================================

async function deletePhoto(photo) {

    const {
        data
    } = await supabase.auth.getUser();


    if (!data.user) {

        return;

    }


    if (data.user.id !== photo.owner_id) {

        alert("Akses ditolak.");

        return;

    }


    const {
        error
    } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);


    if (error) {

        alert(error.message);

        return;

    }


    await supabase.storage
        .from("photos")
        .remove([
            photo.filename
        ]);


    loadPhotos();

}


// =====================================
// COMMENTS
// =====================================

async function loadComments(photoID) {

    const {
        data,
        error
    } =
        await supabase
        .from("comments")
        .select("*")
        .eq("photo_id", photoID)
        .order("created_at", {
            ascending: true
        });


    if (error) {

        return;

    }


    const container =
        document.getElementById(
            "comments-" + photoID
        );


    container.innerHTML = "";


    data.forEach(comment => {

        const div =
            document.createElement("div");


        div.className =
            "comment";


        div.innerHTML = `

            <div class="comment-name">
                Anonymous #${comment.anonymous_number}
            </div>

            <div class="comment-text">
                ${escapeHTML(comment.text)}
            </div>

        `;


        container.appendChild(div);

    });

}


// =====================================
// ADD COMMENT
// =====================================

window.addComment =
async function(photoID) {

    const input =
        document.getElementById(
            "input-" + photoID
        );


    const text =
        input.value.trim();


    if (!text) {

        return;

    }


    const anonymousNumber =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    const {
        error
    } =
        await supabase
        .from("comments")
        .insert({

            photo_id: photoID,

            text: text,

            anonymous_number:
                anonymousNumber

        });


    if (error) {

        alert(error.message);

        return;

    }


    input.value = "";

    loadComments(photoID);

};


// =====================================
// SECURITY
// =====================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


// =====================================
// START
// =====================================

updateUI();

loadPhotos();