import { Link } from 'react-router-dom';
import { Icon } from './Icons';

export function Fab() {
  return (
    <Link to="/edit/new" className="fab" aria-label="Add reminder">
      <Icon name="plus" size={26} />
    </Link>
  );
}
