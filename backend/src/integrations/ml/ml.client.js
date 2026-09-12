// /**
//  * ML client facade.
//  * Phase 3 will call the Python/FastAPI ML service using ML_CONTRACT.md.
//  * Until then, the mock client is used.
//  */
// const mock = require('./ml.mock');

// function getMlClient() {
//   return mock;
// }

// module.exports = {
//   getMlClient,
// };

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function predictFreight(payload) {
  const response = await fetch(
    `${ML_SERVICE_URL}/predict`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `ML service error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

function getMlClient() {
  return {
    predictFreight,
  };
}

module.exports = {
  getMlClient,
};