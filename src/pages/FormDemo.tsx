import CommonWrapper from "@/common/CommonWrapper";
import FormExamples from "@/common/DynamicForm/FormExampleAndGuide/FormExamples";

const FormDemo = () => {
  return (
    <CommonWrapper>
      <div className="min-h-[90vh] flex items-center justify-center">
        <FormExamples />
      </div>
    </CommonWrapper>
  );
};

export default FormDemo;
