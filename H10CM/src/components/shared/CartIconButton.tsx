import React from 'react';
import { IconButton, Badge, Tooltip, useTheme } from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { useCartStore } from 'src/store/cartStore';

interface CartIconButtonProps {
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
  size?: 'small' | 'medium' | 'large';
}

const CartIconButton: React.FC<CartIconButtonProps> = ({ color = 'inherit', size = 'medium' }) => {
  const theme = useTheme();
  const { openCart, getCartSummary } = useCartStore();
  const summary = getCartSummary();

  const handleCartClick = () => {
    openCart();
  };

  return (
    <Tooltip
      title={
        summary.totalItems > 0
          ? `Cart: ${summary.totalItems} items (${summary.totalQuantity} total quantity)`
          : 'Cart is empty'
      }
    >
      <IconButton
        onClick={handleCartClick}
        color={color}
        size={size}
        sx={{
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Badge
          badgeContent={summary.totalItems}
          color="error"
          max={99}
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: '18px',
              minWidth: '18px',
              fontWeight: 600,
            },
          }}
        >
          <CartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default CartIconButton;
