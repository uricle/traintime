#! /usr/bin/perl
use strict;
use LWP::UserAgent;
use HTTP::Request::Common qw(GET);
use utf8;
use Encode;
binmode STDOUT, ":utf8";
my %stationids = (
    # 南北線
    '麻生' => 'N01',
    '北34条' => 'N02',
    '北24条' => 'N03',
    '北18条' => 'N04',
    '北12条' => 'N05',
    'さっぽろ' => 'N06',
    # '大通' => 'N07',
    'すすきの' => 'N08',
    '中島公園' => 'N09',
    '幌平橋' => 'N10',
    '中の島' => 'N11',
    '平岸' => 'N12',
    '南平岸' => 'N13',
    '澄川' => 'N14',
    '自衛隊前' => 'N15',
    '真駒内' => 'N16',
    # 東西線
    '宮の沢' => 'T01',
    '発寒南' => 'T02',
    '琴似' => 'T03',
    '二十四軒' => 'T04',
    '西28丁目' => 'T05',
    '円山公園' => 'T06',
    '西18丁目' => 'T07',
    '西11丁目' => 'T08',
    '大通' => 'T09',
    'バスセンター前' => 'T10',
    '菊水' => 'T11',
    '東札幌' => 'T12',
    '白石' => 'T13',
    '南郷7丁目' => 'T14',
    '南郷13丁目' => 'T15',
    '南郷18丁目' => 'T16',
    '大谷地' => 'T17',
    'ひばりが丘' => 'T18',
    '新さっぽろ' => 'T19',
);

my $ua = LWP::UserAgent->new;
$ua->agent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:9.0.1) Gecko/20100101 Firefox/9.0.1");
$ua->timeout(30);

my @targets = qw|n01 t01|;

# http://www.city.sapporo.jp/st/time/index.html
foreach my $target (@targets) {
    get_subway("http://www.city.sapporo.jp/st/subway/route_time/h26/${target}.html");
}
sub get_subway() {
    my $requesturl = shift;
    my $res = $ua->request(GET $requesturl);
    my $content = $res->decoded_content;

    my $line;
    my $start;
    my $station;
    if ( $content =~ m|<h1>(.+?線)(.+?)駅時刻表（(.+?)）|sio ) {
        ($line,$start,$station) = ($1,$2,$3);
    }
    while( $content =~ m|<h2.*?>([^<]+?)方面</h2>.*?<tbody>(.*?)</tbody>|siog ) {
        my ($houmen, $timetable) = ($1,$2);
        print "===========$houmen $stationids{$houmen}==============\n";
        open my $FH, ">:encoding(utf8)", "$stationids{$start}_$stationids{$houmen}.js";
        print $FH "var timetables = timetables || [];\n";
        print $FH "timetables.push({\n";
        print $FH "    timetable: {\n";
        $timetable =~ s/※\d+//g; # 自衛隊前行き 用
        $timetable =~ s/  / /g;
        while ( $timetable =~ m|<tr.+?>.*?<th[^>]*?>.*?(\d+)時.*?</th>.*?<p[^>]*?>(.+?)</p>|siog ) {
            my ($hour, $mins) = ($1,$2);
            if ( $hour == 0 ) { $hour = 24 }
            $mins =~ s/※//g;
            my @minutes = split(/\s+/, $mins);
            print $FH "        $hour:[".join(',', @minutes)."],\n";
        }
        print $FH "    },\n";
        print $FH "    name: '${start}発 - ${houmen}方面',\n";
        print $FH "    shortname: '$start→$houmen'\n";
        print $FH "});\n";
        close $FH;
    }
}
