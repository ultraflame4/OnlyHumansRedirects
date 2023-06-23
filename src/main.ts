const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const data = urlParams.get("q")

interface dataJsonFormat {
    to: string,
    easter?: boolean
}

async function delay(duration: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

let redirect_to: string | null

/**
 * Setups stuff for redirect
 * Returns false on failure or bad data
 * @param data
 */
function getData(data: string | null): dataJsonFormat | null {
    if (!data) {
        return null
    }
    const decoded = atob(data)

    let setupData: dataJsonFormat;
    try {
        setupData = JSON.parse(decoded)
    } catch (e) {
        return null
    }
    if (!setupData.to) {
        return null
    }

    const redirect_to = setupData?.to;
    const easter: boolean = setupData?.easter ?? false

    return {
        easter: easter, to: redirect_to
    };
}

let challenge_id = document.getElementById("challenge_id");
let redirect = document.getElementById("redirect_to");
let timestamp = document.getElementById("timestamp");
let checkbox = document.getElementById("checkbox");
let title = document.getElementById("title");
let desc = document.getElementById("desc")
let spinner = document.getElementById("spinner");
let captcha = document.getElementById("captcha-btn");
const withHttp = (url:string) => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
async function normalRedirect(config: dataJsonFormat) {
    checkbox?.setAttribute("disabled", "true")
    if (!(config && challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
        return
    }
    title.textContent = "Verifying..."

    await delay(500)
    await delay(getRandomInt(500, 2000))
    desc.innerHTML = `Redirecting to <a href="${config.to}">${config.to}<a/>`
    title.textContent = "Redirecting..."

    await delay(1000);

    window.location.assign(withHttp(config.to))
}

async function main() {
    const config = getData(data)


    if (!(config && challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
        return
    }
    captcha.style.opacity = "0"
    captcha.style.pointerEvents = "none"

    if (config) {
        challenge_id.textContent = data;
        redirect.textContent = config.to;
        timestamp.textContent = Date.now().toString();
        if (config.easter) {
            // hehe
            captcha.innerHTML += `
            <iframe 
            id="easter-el"
            src="https://www.youtube.com/embed/xvFZjo5PgG0" 
            title="YouTube video player" frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            ></iframe>
            `
            window.addEventListener("blur",async (ev) => {
                if (!(config && challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
                    return
                }
                if (document.activeElement instanceof HTMLIFrameElement) {
                    await delay(100)
                    document.body.setAttribute("active","")
                    title.textContent = "Got Em"
                    desc.textContent = "Will redirect you now lmao."
                    await normalRedirect(config)
                }
            });
        }
        else{
            checkbox.addEventListener("change", async (ev) => {
                if (!config.easter) {
                    await normalRedirect(config)
                }
            }, {
                once: true
            });
        }
    } else {
        title.textContent = "Invalid Redirect";
        desc.textContent = "This redirect is not valid!";
        spinner.style.display = "none";
        captcha.style.display = "none";


    }
    await delay(1000);

    captcha.style.opacity = ""
    captcha.style.pointerEvents = ""

}

main()
