using Ninject.Modules;
using Ninject;
using System.Collections.Generic;
using Ninject.Parameters;

namespace AIGenerator.AppBindings
{
    public class CompositionRoot
    {
        private static IKernel _ninjectKernel;

        public static void Wire(INinjectModule module)
        {
            _ninjectKernel = new StandardKernel(module);
        }

        public static T Resolve<T>()
        {
            return _ninjectKernel.Get<T>();
        }

        public static T Resolve<T>(string parameterName, object value)
        {
            ConstructorArgument typeParam = new ConstructorArgument(parameterName, value);
            return _ninjectKernel.Get<T>(typeParam);
        }

        public static T Resolve<T>(Dictionary<string, object> parameters)
        {
            ConstructorArgument[] arguments = new ConstructorArgument[parameters.Count];
            int i = 0;
            foreach(KeyValuePair<string, object> kvp in parameters)
            {
                ConstructorArgument typeParam = new ConstructorArgument(kvp.Key, kvp.Value);
                arguments[i++] = typeParam;
            }
            
            return _ninjectKernel.Get<T>(arguments);
        }
    }
}
