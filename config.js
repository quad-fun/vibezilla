// Load the Google Maps API from JavaScript
function loadGoogleMapsScript() {
    const script = document.getElementById('google-maps-script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.GOOGLE_MAPS_API_KEY}&callback=initGame`;
    script.async = true;
    script.defer = true;
}

// This is where we'd normally load from .env
// For GitHub Pages deployment, we'll need to set this manually
// IMPORTANT: In a real project, you'd use a build step to inject this from .env
const config = {
    GOOGLE_MAPS_API_KEY: AIzaSyDDq8B8hZHxvJb0B3MIh4wM0z43Mo-bDxk // This will be replaced during deployment
};

// Try to load API key from the URL if in development mode (for testing)
function tryLoadApiKeyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey');
    if (apiKey) {
        config.GOOGLE_MAPS_API_KEY = apiKey;
    }
}

// Initialize configuration
(function init() {
    tryLoadApiKeyFromUrl();
    loadGoogleMapsScript();
})();