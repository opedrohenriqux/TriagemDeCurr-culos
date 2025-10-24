import React from 'react';

const InitialsAvatar: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
    const getInitials = (name: string): string => {
        if (!name) return '?';
        const names = name.split(' ').filter(Boolean);
        if (names.length === 0) return '?';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const initials = getInitials(name);

    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
        'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
        'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
        'bg-pink-500', 'bg-rose-500'
    ];
    
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = charCodeSum % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div className={`flex items-center justify-center rounded-full text-white font-bold w-full h-full ${bgColor} ${className || ''}`}>
            <span>{initials}</span>
        </div>
    );
};

export default InitialsAvatar;
