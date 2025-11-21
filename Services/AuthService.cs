using Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Interfaces;
using Common;

namespace Services
{
    public class AuthService : IAuthService
    {
        private readonly string SERVER_URL_PATH = AppData.SERVER_URL + "api/User/";

        public async Task<AuthResponse> GetToken()
        {
            Dictionary<string, string> parameters = new Dictionary<string, string>
            {
                { "username", "user" },
                { "password", "V(kMG*t%yxID5emE" }
            };

            AuthResponse authResponse = new AuthResponse();

            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                HttpResponseMessage response = await client.PostAsync(SERVER_URL_PATH + "Token", new FormUrlEncodedContent(parameters));
                if(response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    string httpData = await response.Content.ReadAsStringAsync();
                    authResponse = JsonConvert.DeserializeObject<AuthResponse>(httpData);
                }
            }

            return authResponse;
        }
    }
}
