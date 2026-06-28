<template>
  <div>
    <UPageHero
      title="Raz-TPA OpenElections"
      description="A hub that allows polling bodies to disemminate election results to watchdogs, media organizations and other third-parties in a convenient, easy to use interface."
      :links="[{
        label: 'Dashboard',
        to: '/dashboard',
        icon: 'i-lucide-layout-dashboard',
        size: 'xl'
      }, {
        label: 'Register',
        to: 'https://trtn.link/register-openelections',
        target: '_blank',
        icon: 'i-lucide-notepad-text',
        size: 'xl',
        color: 'neutral',
        variant: 'subtle'
      }]"
    />
  </div>
</template>
