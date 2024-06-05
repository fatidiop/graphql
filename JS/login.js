function handleLogin(event) {
    // Prevent the form from submitting normally
    event.preventDefault();
    
    // Get the username and password values
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (!username || !password) {
        console.error("Username and password must not be empty");
        return;
    }
    
    // URL de l'endpoint d'authentification
    const authUrl = 'https://learn.zone01dakar.sn/api/auth/signin';

    // Encodage en Base64
var encodedLogin = btoa(username + ':' + password);


console.log(encodedLogin); // Affiche l'encodage en Base64 du mot de passe
    
    // En-têtes pour indiquer que nous envoyons des JSON
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + encodedLogin
    };
    
    // Faire la requête d'authentification
    fetch(authUrl, {
        method: 'POST',
        headers: headers,
    })
    .then(response => {
        console.log('HTTP Status Code:', response.status); // Diagnostic du statut HTTP
        if (!response.ok) {
            alert("invalid username or password ") 
            throw new Error(response.message);
        }
        return response.json(); // Parse the JSON response into native JavaScript objects
    })
    .then(data => {
        console.log('Data received from server:', data); // Diagnostic des données reçues
        localStorage.setItem('jwtToken', data);
        // Redirigez vers la page principale ou effectuez une action similaire
        window.location.href = '/home.html';
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
        
}

document.getElementById('loginbtn').addEventListener('click', handleLogin);

// Exemple de stockage des informations de session
// localStorage.setItem('sessionId', 'votreSessionIdIci');
// localStorage.setItem('username', 'nomUtilisateur');

function logOut() {
    // Supprimer le jeton JWT du localStorage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    localStorage.removeItem('jwtToken');
    
    // Rediriger vers la page home.html
    window.location.href = '/index.html';

    //console.log('logout succed !!');
}
