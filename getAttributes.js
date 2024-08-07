async function getAttributes(page, url) {
  const maxRetries = 2;
  let attempt = 0;
  let success = false;
  let attributes = {};

  while (attempt < maxRetries && !success) {
    try {
      await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });
      console.log('Extracting Player:', url); // Log the player object

      // Wait for the specific element to be available
      await page.waitForSelector('div.Text.jbniIM', { timeout: 10000 });

      // Extract player attributes from .Text.jbniIM
      const attributesSelector = 'div.Text.jbniIM';
      const elements = await page.$$(attributesSelector);

      console.log('Found elements:', elements.length); // Debug log for found elements

      if (elements.length > 0) {
        const contents = await Promise.all(elements.map(async (el) => {
          const text = await el.evaluate(node => node.textContent.trim());
          //console.log('Extracted text:', text); // Debug log for extracted text
          return text; // Return trimmed text
        }));

        //console.log('Contents:', contents); // Debug log for contents

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
      } else {
        console.error('No elements found with the selector:', attributesSelector);
      }

      // Extract strengths and weaknesses
      const strengthsSelector = 'div.Text.hrSHll';
      const weaknessesSelector = 'div.Text.judZtG';

      const strengthsElement = await page.$(strengthsSelector);
      const weaknessesElement = await page.$(weaknessesSelector);

      if (strengthsElement) {
        const strengthsText = await strengthsElement.evaluate(node => node.nextElementSibling.textContent.trim());
        attributes.strengths = strengthsText.split(',').map(str => str.trim());
      }

      if (weaknessesElement) {
        const weaknessesText = await weaknessesElement.evaluate(node => node.nextElementSibling.textContent.trim());
        attributes.weaknesses = weaknessesText.split(',').map(str => str.trim());
      }

      // Update the rating selector based on the provided HTML structure
      const ratingSelector = 'span[role="meter"] > div.Box.klGMtt > span';
      const ratingElement = await page.$(ratingSelector);
      
      if (ratingElement) {
        const rating = await ratingElement.evaluate(node => node.textContent.trim());
        //console.log('Extracted rating:', rating); // Debug log for extracted rating
        attributes.rating = rating;
      } else {
        console.error('Rating element not found with the selector:', ratingSelector);
      }

      // Extract roles from the SVG elements
      const rolesSelector = 'g.sc-fXSgeo';
      const roleElements = await page.$$(rolesSelector);
      attributes.roles = await Promise.all(roleElements.map(async (roleElement) => {
        const roleNameElement = await roleElement.$('text');
        const circleElement = await roleElement.$('circle');
        
        const roleName = await roleNameElement.evaluate(node => node.textContent.trim());
        const fillValue = await circleElement.evaluate(node => node.getAttribute('fill'));
        
        return { role: roleName, fill: fillValue }; // Create an object for each role
      }));

     // console.log('Extracted Roles:', attributes.roles); // Log extracted roles

      console.log('Extracted Attributes:');
      success = true; // Mark as successful
    } catch (error) {
      console.error(`Error in getAttributes for URL ${url} on attempt ${attempt + 1}:`, error);
      attempt++;
      if (attempt >= maxRetries) {
        console.error('Max retries reached. Returning empty attributes.');
      }
    }
  }
  return attributes;
}

module.exports = getAttributes;
