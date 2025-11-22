using AIGeneratorWebApi.Common;
using AIGeneratorWebApi.Interfaces;
using Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIGeneratorWebApi.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment IWebHostEnvironment;
        private readonly IReportFile IReportFile;
        private readonly IFileLog IFileLog;

        public FilesController(IWebHostEnvironment webHostEnvironment, IReportFile reportFile, IFileLog fileLog)
        {
            IWebHostEnvironment = webHostEnvironment;
            IReportFile = reportFile;
            IFileLog = fileLog;
        }

#if DEBUG
        [AllowAnonymous]
#endif
        [HttpPost]
        public async Task<IActionResult> Update(List<ReportFile> reportFiles, string reportId, string userId)
        {
            if (reportFiles.Count == 0)
            {
                IReportFile.RemoveByReport(reportId, IWebHostEnvironment.ContentRootPath);
            }
            else
            {
                reportFiles = UploadFileClass.Upload(reportFiles, reportId, IWebHostEnvironment.ContentRootPath);
                await IFileLog.Add(new FileLog { ReportId = reportId, UserId = userId });
                await IFileLog.SaveChanges();
                List<ReportFile> reportsCopy = new List<ReportFile>();
                reportsCopy.AddRange(reportFiles);
                await IReportFile.Update(reportsCopy, reportId, IWebHostEnvironment.ContentRootPath);
            }
            await IReportFile.SaveChanges();
            return Ok(reportFiles);
        }
    }
}
