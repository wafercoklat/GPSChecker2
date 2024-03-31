// Initialize Leaflet Map
let map = L.map('map').setView([-2.5489, 118.0149], 4); 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Define a flag to track whether the sound has been played during the current refresh cycle
let soundPlayed = false;

function populateMap(vehicles, geofences) {
    // Clear existing markers
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    vehicles.forEach(vehicle => {
        addMarker(vehicle);
        addVehicleToList(vehicle);
    });

    geofences.forEach(geofence => {
        addGeofenceToList(geofence);
    });
}

function addMarker(vehicle) {
    let marker = L.marker([vehicle.Latitude, vehicle.Longitude], {icon: getCustomIcon(vehicle)})
    .bindPopup(`<b>${vehicle.VName}</b><br>Status:<b>${getStatus(vehicle)}</b><br>Job: <b>${vehicle.no_po_customer}</b><br><br>
    <div style="text-align: left;">
        <div style="display: flex; justify-content: space-between;">
            <span>Assigned To Driver</span>
            <span>:${vehicle.Assigntodriver}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Terima Job</span>
            <span>:${vehicle.TerimaJob}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Pengambilan</span>
            <span>:${vehicle.Pengambilan}</span>
        </div>
        <!-- Add more status information as needed -->
        <div style="display: flex; justify-content: space-between;">
            <span>Tiba dilokasi Peng..</span>
            <span>:${vehicle.TibadilokasiPengambilan}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Berangkat</span>
            <span>:${vehicle.Berangkat}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Tiba dilokasi Muat</span>
            <span>:${vehicle.Tibadilokasimuat}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Muat Barang</span>
            <span>:${vehicle.MuatBarang}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Bongkar Muatan</span>
            <span>:${vehicle.BongkarMuatan}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Selesai Bongkar</span>
            <span>:${vehicle.SelesaiBongkar}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Selesai Job</span>
            <span>:${vehicle.Selesai}</span>
        </div>
    </div>`)
        .addTo(map);


    marker.on('click', function() {
        // Remove 'selected' class from all markers
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                layer.setIcon(getCustomIcon(layer.vehicle));  // Use the vehicle from the layer
            }
        });

        // Add 'selected' class to clicked marker
        this.setIcon(L.divIcon({
            className: 'custom-icon selected',
            html: '<div class="vehicle-icon-red red"></div>',
            iconSize: [62, 62],
            iconAnchor: [40, 40]
        }));

        this.openPopup();
    });

    // Store vehicle data with the marker for later use
    marker.vehicle = vehicle;

    return marker;
}

function addVehicleToList(vehicle) {
    const vehicleList = document.getElementById('vehicleList');
    const listItem = document.createElement('li');
    var onjob = vehicle.no_po_customer !== null ? 'On Job' : '';
    listItem.className = 'list-group-item';
    listItem.textContent = `${vehicle.City} - ${vehicle.VName} - ${getStatus(vehicle)}`;

    if (getStatus(vehicle) === 'Parking Idle' || getStatus(vehicle) === 'Out Route') {
        listItem.classList.add('red');
    }
    // Click event listener for vehicle list
    listItem.addEventListener('click', function() {
        map.setView([vehicle.Latitude, vehicle.Longitude], 15);
        addMarker(vehicle).openPopup();

        // Remove 'selected' class from all list items
        const items = vehicleList.getElementsByTagName('li');
        Array.from(items).forEach(item => {
            item.classList.remove('selected');
        });

        // Add 'selected' class to clicked list item
        this.classList.add('selected');
    });

    vehicleList.appendChild(listItem);
}

function addGeofenceToList(geofence) {
    const geofenceList = document.getElementById('geofenceList');
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.textContent = geofence.name;

    geofenceList.appendChild(listItem);
}

// Initial population
function fetchVehicleData() {
    // Reset the soundPlayed flag before fetching new vehicle data
    soundPlayed = false;
    $.ajax({
        url: 'http://localhost:9661/api/data1', // Replace with your vehicles API endpoint
        method: 'GET',
        success: function(vehicles) {
            populateMap(vehicles, []);
        },
        error: function(error) {
            console.error('Error fetching vehicle data:', error);
        }
    });
}

function fetchGeofenceData() {
    $.ajax({
        url: 'https://your-server.com/api/geofences', // Replace with your geofences API endpoint
        method: 'GET',
        success: function(geofences) {
            const vehicleList = document.getElementById('vehicleList');
            const geofenceList = document.getElementById('geofenceList');
            
            // Clear vehicle and geofence lists
            vehicleList.innerHTML = '';
            geofenceList.innerHTML = '';

            // Repopulate vehicle list
            fetchVehicleData();

            // Repopulate geofence list
            geofences.forEach(geofence => {
                addGeofenceToList(geofence);
            });
        },
        error: function(error) {
            console.error('Error fetching geofence data:', error);
        }
    });
}

fetchVehicleData(); // Initial fetch for vehicles
fetchGeofenceData(); // Initial fetch for geofences

// Search functionality for Vehicles
function filterVehicleList() {
    const query = document.getElementById('vehicleSearchInput').value.trim().toLowerCase();
    const keywords = query.split(';');
    const selectedCity = document.getElementById('vehicleFilterSelect').value;
    const selectedStatus = document.getElementById('vehicleFilterSelect2').value;

    const vehicleList = document.getElementById('vehicleList');
    const items = vehicleList.getElementsByTagName('li');

    Array.from(items).forEach(item => {
        const vehicleText = item.textContent.toLowerCase();
        const parts = vehicleText.split(' - ');
        const vehicleCity = parts[0];
        const vehicleName = parts[1];
        const vehicleStatus = parts[2];

        let match = true;

        // Check if the vehicle name matches the search query
        keywords.forEach(keyword => {
            if (!(vehicleCity.includes(keyword) || vehicleName.includes(keyword) || vehicleStatus.includes(keyword))) {
                match = false;
            }
        });

        // Check if the vehicle's city matches the selected city filter
        if (selectedCity !== 'all' && vehicleCity !== selectedCity.toLowerCase()) {
            match = false;
        }

        // Check if the vehicle's status matches the selected status filter
        if (selectedStatus !== 'all' && vehicleStatus !== selectedStatus.toLowerCase()) {
            match = false;
        }

        // Display or hide the list item based on match result
        if (match) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add event listener for input change on vehicle search input
document.getElementById('vehicleSearchInput').addEventListener('input', filterVehicleList);

// Add event listener to filter vehicles by city and status
document.getElementById('vehicleFilterSelect').addEventListener('change', filterVehicleList);
document.getElementById('vehicleFilterSelect2').addEventListener('change', filterVehicleList);


// Trigger search on pressing Enter
document.getElementById('vehicleSearchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        this.dispatchEvent(new Event('input')); // Dispatch input event to trigger search
    }
});


// Search functionality for Geofences
document.getElementById('geofenceSearchInput').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const geofenceList = document.getElementById('geofenceList');
    const items = geofenceList.getElementsByTagName('li');

    Array.from(items).forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});

//Additional Function
function getCustomIcon(vehicle) {
    let iconColorClass = vehicle.Timeout === 1 ? "red" : "green";
    return L.divIcon({
        className: 'custom-icon',
        html: `<div class="vehicle-icon-${iconColorClass}"></div>`,
        iconSize: [62, 62],
        iconAnchor: [40, 40]
    });
}

// Define function to play sound
function playSound(soundFile) {
    var audio = new Audio(soundFile);
    audio.play();
}

// Define function to play sound with permission handling
function playSoundWithPermission(soundFile) {
    // Check if the browser supports the Web Audio API
    if (window.AudioContext || window.webkitAudioContext) {
        // Check if permission is already granted
        if (window.AudioContext && window.AudioContext.state === 'suspended') {
            // Request permission if not granted
            window.AudioContext.resume().then(() => {
                playSound(soundFile); // Proceed with playing the sound
            });
        } else if (window.webkitAudioContext && window.webkitAudioContext.state === 'suspended') {
            // Request permission if not granted (for Safari)
            window.webkitAudioContext.resume().then(() => {
                playSound(soundFile); // Proceed with playing the sound
            });
        } else {
            // Permission is already granted, proceed with playing the sound
            playSound(soundFile);
        }
    } else {
        // Web Audio API is not supported, handle it accordingly
        console.error('Web Audio API is not supported.');
    }
}

// Modify getStatus function to play sound when Timeout is 1
function getStatus(vehicle) {
    var stats = '';
    if (vehicle.InGarage === 0) {
        if (vehicle.InDestination === 0) {
            stats = vehicle.Timeout === 0 ? '' : 
                    vehicle.Timeout === 1 ? 'Parking Idle' : 
                    '' + " - " + vehicle.InRoute === 0 ? 'Out Route' : ' In Route';
            if (vehicle.Timeout === 1 && !soundPlayed) {
                playSound('./public/sound/alert.mp3');
                soundPlayed = true; // Set the flag to true to indicate that the sound has been played
            }
        } else {
            stats = vehicle.InGarage === 1 ? 'In Garage' : '' + " - " + vehicle.InDestination === 1 ? 'In Destination' : '';
        }
    } else {
        stats = vehicle.InGarage === 1 ? 'In Garage' : '' + " - " + vehicle.InDestination === 1 ? 'In Destination' : '';
    }
    return stats;
}

// Polling to update geofence data every 2 seconds
setInterval(fetchGeofenceData, 5000); // 2 seconds in milliseconds
