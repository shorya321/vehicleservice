import * as React from 'react';
import { emailStyles } from '../styles/constants';

interface ListProps {
  items: string[];
  ordered?: boolean;
}

/** Bulleted or numbered list, in the tenant's body text colour. */
export const List = ({ items, ordered = false }: ListProps) => {
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag style={emailStyles.list}>
      {items.map((item, index) => (
        <li key={index} style={emailStyles.listItem}>
          {item}
        </li>
      ))}
    </ListTag>
  );
};

export default List;
