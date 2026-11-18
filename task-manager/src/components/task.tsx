type TaskProps = {
  title: string
}

function Task({ title }: TaskProps) {
  return (
    <div>
      <input type="checkbox" />
      <span>{title}</span>
    </div>
  )
}

export default Task