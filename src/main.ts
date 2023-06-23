const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const data = urlParams.get("q")

interface dataJsonFormat {
    to: string,
    easter?: boolean
}

let redirect_to: string | null
/**
 * Setups stuff for redirect
 * Returns false on failure or bad data
 * @param data
 */
function getData(data: string | null): dataJsonFormat|null {
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

const config = getData(data)
if (config) {
    let challenge_id = document.getElementById("challenge_id");
    if (challenge_id) {
        challenge_id.textContent = data
    }
    let redirect = document.getElementById("redirect_to");
    if (redirect) {
        redirect.textContent = config.to
    }
    let timestamp = document.getElementById("timestamp");
    if (timestamp) {
        timestamp.textContent = Date.now().toString()
    }
} else {
    let title = document.getElementById("title")
    if (title) {
        title.textContent = "Invalid Redirect"
    }
    let desc = document.getElementById("desc")
    if (desc) {
        desc.textContent = "This redirect is not valid!"
    }
    let spinner = document.getElementById("spinner");
    if (spinner) {
        spinner.style.display = "none"
    }
    let captcha = document.getElementById("captcha-btn");
    if (captcha) {
        captcha.style.display = "none"
    }

}
