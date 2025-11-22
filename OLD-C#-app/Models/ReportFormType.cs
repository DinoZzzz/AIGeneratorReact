namespace Models
{
    public class ReportFormType
    {
        public int Id { get; set; }
        public int TypeId { get; set; }
        public string Name { get; set; } 

        public override string ToString()
        {
            return Name;
        }
    }
}
