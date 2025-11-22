using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AIGeneratorWebApi.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok("Hello from Get");

        [HttpPost]
        public IActionResult Post() => Ok("Hello from Post");

        [HttpPost]
        public IActionResult Database() => Ok("Database OK");
    }
}
