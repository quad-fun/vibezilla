// API key configuration (load from .env in production)
const config = {
    // Replace this with your API key before deploying
    GOOGLE_MAPS_API_KEY: AIzaSyDDq8B8hZHxvJb0B3MIh4wM0z43Mo
};

// Load Google Maps API script
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.GOOGLE_MAPS_API_KEY}&callback=initGame`;
    script.async = true;
    document.body.appendChild(script);
}

// Try to load API key from URL parameter (for development)
function tryLoadApiKeyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey');
    if (apiKey) {
        config.GOOGLE_MAPS_API_KEY = apiKey;
        console.log("Using API key from URL parameter");
    }
}

// Initialize config and load Maps API
(function init() {
    tryLoadApiKeyFromUrl();
    loadGoogleMapsAPI();
})();