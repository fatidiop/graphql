const URL = "https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql";
const firstQuery = `
query event_user{
  user {
    id
    login
    campus
  }
}
`;
const query = `
query getUserInfo($name:String!, $userId:Int!, $campus:String!) {
  event_user(
      where: {event: {path: {_eq: "/dakar/div-01"}}, user: {login: {_eq: $name}}}
      order_by: {user: {login: asc}}
    ) {
      level
      event {
        object {
          name
        }
      }
      user {
        audits(where: {auditorLogin: {_eq: $name}, _and: {grade: {_is_null: false}}}) {	
          auditorLogin
          grade
          
          group {
            captainLogin
            object {
              name
            }
          }
        }
        auditRatio
        login
        lastName
        firstName
        attrs
        projectsFinished: progresses_aggregate(
          distinct_on: [objectId]
          where: {event: {object: {id: {_eq: 100256}}, _and: {campus: {_eq: $campus}}}, isDone: {_eq: true}}
        ) {
          aggregate {
            count
          }
        }
        projectsInProgress: progresses_aggregate(
          where: {_and: [{path: {_ilike: "%/div-01/%"}}, {isDone: {_eq: false}}]}
        ) {
          aggregate {
            count
          }
        }
        ProjectValidated: progresses(
          where: {grade: {_gt: 1}, _and: {path: {_ilike: "%/div-01/%"}}, isDone: {_eq: true}}
          order_by: {updatedAt: desc}
        ) {
          group {
            captainLogin
            members {
              userLogin
            }
            auditors(where: {grade: {_is_null: false}}) {
              auditorLogin
              grade
            }
          }
          updatedAt
          grade
          object {
            name
          }
        }
        results(
          where: {object: {name: {_eq: "Checkpoint"}}, grade: {_is_null: false}}
          order_by: {grade: desc}
          limit: 1
        ) {
          grade
        }
        xps(where: {path: {_regex: "^\/dakar\/div-01\/(?!.*(?:checkpoint|piscine)).*$"} }) {
          amount
          path
        }
        transactions(
          order_by: [{ type: desc }, { amount: desc }]
          where: { 
            userId: { _eq: $userId }
            type: { _like: "skill_%" }
          }
        ) { 
          type
          amount
           path
        }
        transactions_aggregate(
          where: {type: {_eq: "xp"}, event: {object: {id: {_eq: 100256}}}}
          ) {
            aggregate {
              sum {
                amount
              }
            }
          }
      }
      
    }
    audit(
      where: {
        group: { campus: { _eq: $campus } }
        grade: { _is_null: true },
        resultId: { _is_null: true },
        auditorId: { _eq: $userId },
        private: {code: {_is_null: false}}
      },
      order_by: {endAt: asc_nulls_last, createdAt: asc}
   ) {
      id
      group {
        id
        path
        captainLogin
        captain {
          isAvailable
        }
      }
      private { code }
      createdAt
      endAt
      version
      grade
   }
  }
`;
const variables = {
  name: "",
  userId: 0,
  campus: "dakar",
};
// Récupérer le token du localStorage
const jwtToken = localStorage.getItem("jwtToken");
// Vérifier si le token existe
async function fetchLogin() {
  // fonction pour effectuer la première requete pour avoir le login
  try {
      const response = await fetch(URL, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
              query: firstQuery,
          }),
      });
      if (!response.ok) {
        // console.log('not ok')
          throw new Error(
              `Erreur HTTP: ${response.status}, ${response.statusText}`
          );
      }
      const responseData = await response.json();
      if (responseData.data.user.length > 0) {
          variables.name = responseData.data.user[0].login;
          variables.userId = responseData.data.user[0].id;
          variables.campus = responseData.data.user[0].campus;
      //     fetchData();
      } else {
          console.error(
              "Aucun utilisateur trouvé avec l'adresse e-mail spécifiée."
          );
      }
  } catch (error) {
      console.error(
          "Erreur lors de la récupération des données GraphQL :",
          error.message
      );
  }

  try {
      const response = await fetch(URL, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            query,
            variables: variables,
          }),
      });
      if (!response.ok) {
        
          throw new Error(
              `Erreur HTTP: ${response.status}, ${response.statusText}`
          );
      }
      const responseData = await response.json();

      //Recuperation puis affiachage des XP
       let total_xp = responseData.data.event_user[0].user.transactions_aggregate.aggregate.sum.amount;
      if (total_xp < 1000) {
        document.getElementById("XP").textContent = total_xp +' B'
      }else if (total_xp < 1000000) {
        total_xp = total_xp / 1000;
        document.getElementById("XP").textContent = total_xp.toFixed(2) +' kB';
      }else {
        total_xp = total_xp / 1000000;
        document.getElementById("XP").textContent = (total_xp).toFixed(2) +' MB'
      }

      //Recuperation puis affichage du level et de l'audit
      document.getElementById("level").textContent = responseData.data.event_user[0].level
      document.getElementById("audit").textContent = responseData.data.event_user[0].user.auditRatio.toFixed(2) 
      
      //Mise en place des deux graphes svg
      const temp = responseData.data.event_user[0].user.xps;
      drawHistogram(temp, 'bar');
      const delta = responseData.data.event_user[0].user.audits;
      drawLineGraph(delta, 'line');

      //Message de bienvenue
      document.getElementById("identity").textContent = `Hi ${responseData.data.event_user[0].user.firstName} !` 
  
  } catch (error) {
      console.error(
          "Erreur lors de la récupération des données GraphQL :",
          error.message
      );
  }
}
console.log(jwtToken);
fetchLogin()

function drawHistogram(data, containerId) {
  const container = document.getElementById(containerId);
  let svg = '<svg width="900" height="400">';

  let barWidth = (800 / data.length); // Largeur des barres
  let barGap = (100 / (data.length - 1)); // Espace entre les barres
  let maxAmount = Math.max(...data.map(d => d.amount)); // Trouver la valeur maximale pour normaliser
  let scaleFactor = 350 / maxAmount; // Normaliser pour que la barre la plus haute ait une hauteur de 350

  data.forEach((item, index) => {
    let barHeight = item.amount * scaleFactor;
    let barX = index * (barWidth + barGap);
    svg += `<rect class="bar" x="${barX}" y="${400 - barHeight}" width="${barWidth}" height="${barHeight}" fill="steelblue" />`;
    svg += `<text class="bar-text" x="${barX + barWidth / 2}" y="${400 - barHeight - 5}" text-anchor="middle">${item.path.split('/').pop()}</text>`; // Afficher uniquement le dernier segment du chemin
  });

  svg += '</svg>';
  container.innerHTML = '<h3>XP</h3>' + svg;

  // Ajouter les événements de survol
  const bars = container.querySelectorAll('.bar');
  const texts = container.querySelectorAll('.bar-text');

  bars.forEach((bar, index) => {
    bar.addEventListener('mouseover', () => {
      texts[index].style.display = 'block';
    });

    bar.addEventListener('mouseout', () => {
      texts[index].style.display = 'none';
    });
  });
}

function drawLineGraph(data, containerId) {
  const container = document.getElementById(containerId);
  let svg = `<svg width="800" height="400" viewBox="0 0 800 400">
      <defs>
          <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5"
                  markerWidth="6" markerHeight="6"
                  orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
          </marker>
          <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5"
                  markerWidth="6" markerHeight="6"
                  orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
          </marker>
      </defs>`;

  let maxGrade = Math.max(...data.map(d => d.grade));
  let minGrade = Math.min(...data.map(d => d.grade));
  let gradeRange = maxGrade - minGrade;

  let padding = 40;
  let width = 800 - 2 * padding;
  let height = 400 - 2 * padding;

  let xScale = width / (data.length - 1);
  let yScale = height / gradeRange;

  let points = data.map((d, i) => ({
      x: padding + i * xScale,
      y: padding + (maxGrade - d.grade) * yScale
  }));

  // Draw axes with arrows
  svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${400 - padding}" stroke="black" marker-start="url(#arrow-start)" />`; // Y axis with arrow at the top
  svg += `<line x1="${padding}" y1="${400 - padding}" x2="${800 - padding}" y2="${400 - padding}" stroke="black" marker-end="url(#arrow-end)" />`; // X axis with arrow at the end

  // Draw the line
  for (let i = 0; i < points.length - 1; i++) {
      svg += `<line x1="${points[i].x}" y1="${points[i].y}" x2="${points[i + 1].x}" y2="${points[i + 1].y}" stroke="steelblue" />`;
  }

  // Draw the points
  points.forEach(point => {
      svg += `<circle class="grade-point" cx="${point.x}" cy="${point.y}" r="3" />`;
  });

  svg += '</svg>';
  container.innerHTML = '<h3>Ratio audits evolutions</h3>'+ svg;
}

// drawLineGraph(data, 'line');

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname == '/home.html' && !localStorage.getItem('jwtToken')) {
    window.location.href = '/405.html'
  }
});

window.addEventListener('popstate', function() {
  if (window.location.pathname == '/home.html' && !localStorage.getItem('jwtToken')) {
    window.location.href = '/index.html'
  }
});