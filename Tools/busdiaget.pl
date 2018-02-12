#! /usr/bin/perl
use strict;
use LWP::UserAgent;
use HTTP::Request::Common qw(GET);
use utf8;
use Encode;
binmode STDOUT, ":utf8";
my %stationids = (
    '宮43' => 'M43',
);

my $ua = LWP::UserAgent->new;
$ua->agent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:9.0.1) Gecko/20100101 Firefox/9.0.1");
$ua->timeout(30);

# http://www.busdia.com/mobileTimeTable/stDepArr/ にアクセスして
# 必要な時刻表の
# http://www.busdia.com/mobileTimeTable/timeOfPassage/?tid= の後ろのIDを列挙する
# 末尾01が平日用, 02が土日祝日用の模様
my @targets = qw||;

foreach my $target (@targets) {
    get_busdia($target);
}
sub get_busdia() {
    my $requestid = shift;
    my $requesturl = "http://www.busdia.com/mobileTimeTable/timeOfPassage/?tid=${requestid}";
    my $res = $ua->request(GET $requesturl);
    my $content = $res->decoded_content;

    my $linename = "";
    my $endstation = "";
    my $startstation = "";
    if ( $content =~ m|<center><b>(.+?)</b></center>|sio ) {
        $startstation = $1;
    }
    open my $FH, ">:encoding(utf8)", "$requestid.js";
    print $FH "var timetables = timetables || [];\n";
    print $FH "timetables.push({\n";
    print $FH "    timetable: {\n";
    if ( $content =~ m|</center><hr>(.+?)<hr>(.+?)<hr>|sio ) {
        my ($lineinfo, $timetable) = ($1,$2);
        if ( $lineinfo =~ m|\[(.+?)\]\s*?(\S+?)行\s*(\S+線)|sio ) {
            ($linename,$endstation) = ($1,$2);
            print "$1,$2,$3\n";
        }
        $timetable =~ s/[◆■▼金]//g;
        while( $timetable =~ m|\s*(\d+)時\s([-\d\s]+)|siog ) {
            my ($hour,$mins) = ($1,$2);
            if ( $mins ne "-" ) {
                my @minutes = split(/\s/, $mins);
                print $FH "        $hour: [" . join(',', @minutes) . "],\n";
            }
        }
    }
    print $FH "    },\n";
    print $FH "    name: '$startstation - $endstation',\n";
    my $shortname = $startstation;
    $shortname =~ s/地下鉄//;
    $shortname =~ s/駅前//;
    print $FH "    shortname: '$shortname→$endstation'\n";
    print $FH "});\n";
}
