const { default: axios } = require('axios');

async function enrichUserProfile(email) {
  const result = await axios.get(
    'https://nubela.co/proxycurl/api/linkedin/profile/resolve/email?email=junaidofficialnow@gmail.com&first_name=junaid&last_name=Mancheri&company_domain=Askeva&enrich_profil=enrich&lookup_depth=deep&similarity_checks=skip&location=India',
    {
      headers: {
        Authorization: 'Bearer'
      }
    }
  );
  console.log(result.data, 'adf');
}
enrichUserProfile();