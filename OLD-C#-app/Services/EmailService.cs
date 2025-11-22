using Interfaces;
using Microsoft.SqlServer.Server;
using Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class EmailService : IEmailService
    {
        public bool SendSupportEmail(User user, Contact contact)
        {
            try
            {
                MailMessage mailMessage = new MailMessage
                {
                    From = new MailAddress("support@digitando-web-test.com.hr"),
                    Subject = "AIGenerator - Prijava greške",
                    Body = (user == null ? "Anonimni korisnik" : "Korisnik <b>" + user.GetName() + "</b>") + " prijavljuje grešku unutar aplikacije.<br><br><b>Gdje greška nastaje?</b><br>" + contact.ApplicationPart + "<br><br><b>Poruka:</b><br>" + contact.Description + "<br><br><b>Verzija aplikacije:</b><br>" + contact.Version,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(new MailAddress("support@digitando.net"));
                SmtpClient smtpClient = new SmtpClient("mail.digitando-web-test.com.hr")
                {
                    Port = 587,
                    Credentials = new System.Net.NetworkCredential("support@digitando-web-test.com.hr", "@%Thb%g3inMJ"),
                    EnableSsl = true
                };
                smtpClient.Send(mailMessage);
            }
            catch { return false; }
            return true;
        }
    }
}
