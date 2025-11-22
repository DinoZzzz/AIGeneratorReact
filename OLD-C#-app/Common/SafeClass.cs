using System;
using System.Security.Cryptography;
using System.Text;

namespace Common
{
    public class SafeClass
    {
        public static string HashPassword(string password)
        {
            var bytes = new UTF8Encoding().GetBytes(password);
            byte[] hashBytes;
            using (var algorithm = new SHA512Managed())
            {
                hashBytes = algorithm.ComputeHash(bytes);
            }
            return Convert.ToBase64String(hashBytes);
        }

        static AesCryptoServiceProvider aesCryptoServiceProvider = new AesCryptoServiceProvider();

        public static string EncryptData(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            byte[] textbytes = Encoding.ASCII.GetBytes(text);
            CryptoService();
            ICryptoTransform icrypt = aesCryptoServiceProvider.CreateEncryptor(aesCryptoServiceProvider.Key, aesCryptoServiceProvider.IV);
            byte[] enc = icrypt.TransformFinalBlock(textbytes, 0, textbytes.Length);
            icrypt.Dispose();
            return Convert.ToBase64String(enc);
        }

        public static string DecryptData(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            byte[] textbytes = Convert.FromBase64String(text);
            CryptoService();
            ICryptoTransform icrypt = aesCryptoServiceProvider.CreateDecryptor(aesCryptoServiceProvider.Key, aesCryptoServiceProvider.IV);
            byte[] enc = icrypt.TransformFinalBlock(textbytes, 0, textbytes.Length);
            icrypt.Dispose();
            return Encoding.ASCII.GetString(enc);
        }

        private static void CryptoService()
        {
            aesCryptoServiceProvider.BlockSize = 128;
            aesCryptoServiceProvider.KeySize = 256;
            aesCryptoServiceProvider.IV = Encoding.ASCII.GetBytes("0123456789abcdef");
            aesCryptoServiceProvider.Key = Encoding.ASCII.GetBytes("0123456789abcdef0123456789abcdef");
            aesCryptoServiceProvider.Padding = PaddingMode.PKCS7;
            aesCryptoServiceProvider.Mode = CipherMode.CBC;
        }
    }
}
