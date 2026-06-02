const WorkInProgress = ({ title }: { title: string }) => {
  return (
    <h1 className="w-[80vw] h-[90vh] flex items-center justify-center text-7xl font-black text-[#e8ecf0] uppercase text-center">
      {title}
    </h1>
  );
};

export default WorkInProgress;
