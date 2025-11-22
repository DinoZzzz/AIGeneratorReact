using AIGeneratorWebApi.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models;

namespace AIGeneratorWebApi.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<IdentityUser> userManager;
        private readonly IJwtService IJwtService;

        public UserController(UserManager<IdentityUser> userManager, IJwtService jwtService)
        {
            this.userManager = userManager;
            IJwtService = jwtService;
        }

        //[HttpPost]
        //public async Task<ActionResult<User>> Create(User user)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }

        //    var result = await userManager.CreateAsync(new IdentityUser() { UserName = user.Username, Email = user.Email }, user.Password);

        //    if (!result.Succeeded)
        //    {
        //        return BadRequest(result.Errors);
        //    }

        //    user.Password = "";
        //    return Created("", user);
        //}

        [AllowAnonymous]
        [HttpPost]
        [Consumes("application/x-www-form-urlencoded")]
        public async Task<ActionResult<AuthResponse>> Token([FromForm] AuthRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("Bad credentials");
            }

            var user = await userManager.FindByNameAsync(request.Username);

            if (user == null)
            {
                return BadRequest("Bad credentials");
            }

            var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);

            if (!isPasswordValid)
            {
                return BadRequest("Bad credentials");
            }

            var token = IJwtService.CreateToken(user);

            return Ok(token);
        }
    }
}
