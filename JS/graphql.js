const userId = 'votre-id-utilisateur-ici'; // Remplacez par l'ID réel de l'utilisateur
const jwtToken = 'https://learn.zone01dakar.sn/api/auth/signin'; // Remplacez par votre jeton JWT réel

// Constructeur de la requête GraphQL
const query = `
  query GetUser($userId: ID!) {
    user(id: $userId) {
      id
      name
      email
    }
  }
`;

// Variables à passer à la requête
const variables = { userId };

// En-têtes pour la requête
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${jwtToken}`, // Inclusion du jeton JWT ici
};

// L'URL de votre point de terminaison GraphQL
const url = 'https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql';

// Faire la requête
fetch(url, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    query: query,
    variables: variables,
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erreur lors de la récupération des données:', error));