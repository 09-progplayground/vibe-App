// MITE's approximate campus coordinates
const campusCenter = [13.050621, 74.966475];

// Create the map
const map = L.map("map").setView(campusCenter, 17);

// Load OpenStreetMap tiles
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// Get saved locations from LocalStorage
let locations = JSON.parse(
    localStorage.getItem("campusLocations")
) || [];

let markers = [];

let addingLocation = false;


// HTML elements
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationList = document.getElementById("locationList");
const statusText = document.getElementById("status");


// Save locations
function saveLocations() {

    localStorage.setItem(
        "campusLocations",
        JSON.stringify(locations)
    );

}


// Display locations on map and sidebar
function displayLocations() {

    markers.forEach(marker => map.removeLayer(marker));

    markers = [];

    locationList.innerHTML = "";

    const searchValue = searchInput.value.toLowerCase();

    const categoryValue = categoryFilter.value;

    const filteredLocations = locations.filter(location => {

        const matchesSearch =
            location.name.toLowerCase().includes(searchValue);

        const matchesCategory =
            categoryValue === "All" ||
            location.category === categoryValue;

        return matchesSearch && matchesCategory;

    });


    filteredLocations.forEach(location => {

        // Add map marker
        const marker = L.marker([
            location.lat,
            location.lng
        ]).addTo(map);

        marker.bindPopup(`
            <b>${escapeHTML(location.name)}</b>
            <br>
            ${escapeHTML(location.category)}
        `);

        markers.push(marker);


        // Create sidebar card
        const card = document.createElement("div");

        card.className = "location-card";

        const title = document.createElement("h4");
        title.textContent = location.name;

        const category = document.createElement("p");
        category.textContent = location.category;

        card.appendChild(title);
        card.appendChild(category);

        card.addEventListener("click", () => {

            map.setView([
                location.lat,
                location.lng
            ], 19);

            marker.openPopup();

        });

        locationList.appendChild(card);

    });


    if (filteredLocations.length === 0) {

        locationList.textContent = "No locations found.";

    }

}


// Escape user-provided text before inserting it into popup HTML
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

}


// Search functionality
searchInput.addEventListener("input", displayLocations);


// Category filter
categoryFilter.addEventListener("change", displayLocations);


// Find user's current location
document.getElementById("locateBtn").addEventListener("click", () => {

    if (!navigator.geolocation) {

        statusText.textContent =
            "Geolocation is not supported by this browser.";

        return;

    }

    statusText.textContent = "Finding your location...";

    navigator.geolocation.getCurrentPosition(

        position => {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 18);

            L.marker([lat, lng])
                .addTo(map)
                .bindPopup("You are here!")
                .openPopup();

            statusText.textContent = "Your location found!";

        },

        error => {

            statusText.textContent =
                "Location unavailable. Check your browser permissions.";

        }

    );

});


// Enable add-location mode
document.getElementById("addLocationBtn").addEventListener("click", () => {

    addingLocation = true;

    statusText.textContent =
        "Click the map where the building is located.";

});


// Click the map to add a new location
map.on("click", event => {

    if (!addingLocation) return;

    const name = prompt("Enter building or facility name:");

    if (!name || !name.trim()) {

        addingLocation = false;
        statusText.textContent = "Location not added.";

        return;

    }

    const category = prompt(
        "Enter category: Academic, Laboratory, Food or Facilities"
    );

    const validCategories = [
        "Academic",
        "Laboratory",
        "Food",
        "Facilities"
    ];

    if (!category ||
        !validCategories.includes(category.trim())) {

        statusText.textContent = "Invalid category.";
        addingLocation = false;

        return;

    }


    const newLocation = {

        name: name.trim(),

        category: category.trim(),

        lat: event.latlng.lat,

        lng: event.latlng.lng

    };


    locations.push(newLocation);

    saveLocations();

    displayLocations();

    statusText.textContent =
        `${newLocation.name} added successfully!`;

    addingLocation = false;

});


// Load saved locations
displayLocations();