const fs = require('fs');
const getAttributes = require('./getAttributes'); // Ensure correct import

function extractPlayerId(url) {
  const regex = /\/player\/[^/]+\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function changeTab(url) {
  const squadTab = '#tab:squad';
  const detailsTab = '#tab:details';

  if (url.includes(squadTab)) {
    return url.replace(squadTab, detailsTab);
  } else if (url.includes(detailsTab)) {
    return url.replace(detailsTab, squadTab);
  } else {
    return url.includes('#') ? url : url + squadTab;
  }
}

async function extractTeam(page, url, attributes, image) {
  let team = { colors: [], stadium: { name: '', capacity: 0 } };

  await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });
  const nextData = await page.$eval('#__NEXT_DATA__', el => el.textContent);
  const data = JSON.parse(nextData).props.pageProps;
  
  // Logging the data structure for debuggingteam
  //console.log(JSON.stringify(data, null, 2));
  console.log(data.teamDetails)
  const playersArr = data.players.players; // Array of players
  team.colors = data.teamDetails.teamColors;
  team.city = data.teamDetails.venue.city.name;
  team.coachId = data.teamDetails.manager.id;
   // Coach information
  team.coachLink = 'https://www.sofascore.com/manager/' +  data.teamDetails.manager.slug + '/' + data.teamDetails.manager.id
  console.log(team.coachLink);
  team.abbr = data.teamDetails.nameCode;
  team.stadium.name = data.teamDetails.venue.stadium.name;
  team.stadium.capacity = data.teamDetails.venue.stadium.capacity;
  const followerSelector = 'span.Text.jpoqeG';
  const followerElement = await page.$(followerSelector);
  if (followerElement) {
    const followers = await followerElement.evaluate(node => node.textContent.trim());
    team.followers = followers;
  }
  console.log('Followers:', team.followers);

  team.roster = await Promise.all(playersArr.map(async (player) => {
    const playerInfo = player.player;
    const plUrl = `https://www.sofascore.com/player/${playerInfo.slug}/${playerInfo.id}`;
    //let plAttributes = null;
   /*  if (attributes) {
      try {
        await page.goto(plUrl, { timeout: 100000, waitUntil: 'domcontentloaded' });
        console.log('Extracting Player:', plUrl); // Log the player object
    
        let attributes = {};
        // Extract player attributes from .Text.jbniIM
        const attributesSelector = '.Text.jbniIM';
        const elements = await page.$$(attributesSelector);
        if (elements.length > 0) {
          const contents = await Promise.all(elements.map(async (el) => {
            const text = await el.evaluate(node => node.textContent.trim());
            return text; // Return trimmed text
          }));
          // Assuming the contents are in the order of ATT, TEC, TAC, DEF, CRE
          if (contents.length >= 5) {
            attributes = {
              ATT: contents[0],
              TEC: contents[1],
              TAC: contents[2],
              DEF: contents[3],
              CRE: contents[4],
            };
          }
        }
        // Extract the hidden rating value
        const ratingSelector = '.bWxCbG > span';
        const ratingElement = await page.$(ratingSelector);
        if (ratingElement) {
          const rating = await ratingElement.evaluate(node => node.textContent.trim());
          attributes.rating = rating;
        }
        console.log('Extracted Player:', plUrl); // Log the player object
      } catch (error) {
        console.error(`Error in getAttributes for plUrl ${plUrl}:`, error); // Return an empty object on error
      }
    } */
    // Return player data along with URL
    return {
      name: playerInfo.name,
      url: plUrl,
      id: extractPlayerId(plUrl),
      position: playerInfo.position,
      jerseyNumber: playerInfo.jerseyNumber,
      height: playerInfo.height,
      preferredFoot: playerInfo.preferredFoot,
      country: playerInfo.country.alpha3,
      shirtNumber: playerInfo.shirtNumber,
      dateOfBirth: new Date(playerInfo.dateOfBirthTimestamp * 1000).toLocaleDateString(),
      marketValue: playerInfo.proposedMarketValue,
    };
  }));
  //team.roster = null;
  //console.log(team);
  return team;
}

module.exports = extractTeam;
