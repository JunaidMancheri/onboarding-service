const { default: axios } = require('axios');

async function enrichUserProfile(userData) {
  let company = '';
  switch (userData.role) {
    case 'Individual': {
      const url = `https://nubela.co/proxycurl/api/linkedin/profile/resolve`;
      const result = await axios.get(url, {
        params: {
          company_domain: company,
          first_name: userData.firstName,
          last_name: userData.lastName,
          similarity_checks: 'skip',
          location: 'Bangalore',
        },
        headers: { Authorization: 'Bearer ' + process.env.PROXY_CURL_TOKEN },
      });

      const response = await axios.get(
        'https://nubela.co/proxycurl/api/v2/linkedin',
        {
          params: {
            linkedin_profile_url: result.data.url,
          },
          headers: { Authorization: 'Bearer ' + process.env.PROXY_CURL_TOKEN },
        }
      );
      return response.data;
    }

    case 'Industry': {
      const url = 'https://nubela.co/proxycurl/api/linkedin/company/resolve';
      const result = await axios.get(url, {
        params: { company_name: userData?.organization },
        headers: { Authorization: 'Bearer ' + process.env.PROXY_CURL_TOKEN },
      });
      const companyLookupUrl =
        'https://nubela.co/proxycurl/api/linkedin/company';
      const response = await axios.get(companyLookupUrl, {
        params: { url: result.data?.url },
        headers: { Authorization: 'Bearer ' + process.env.PROXY_CURL_TOKEN },
      });
      return response.data;
    }

    case 'Institution': {
      return {
        no_data:
          "the system coudn't find any data about this institution, please let the user know and continue",
      };
    }
  }
}


module.exports = enrichUserProfile;
